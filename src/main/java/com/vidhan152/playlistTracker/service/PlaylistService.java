package com.vidhan152.playlistTracker.service;

import com.vidhan152.playlistTracker.client.YoutubeClient;
import com.vidhan152.playlistTracker.dto.YoutubePlaylistDto;
import com.vidhan152.playlistTracker.dto.YoutubeVideoDto;
import com.vidhan152.playlistTracker.dto.request.AddPlaylistRequest;
import com.vidhan152.playlistTracker.dto.response.*;
import com.vidhan152.playlistTracker.entity.Playlist;
import com.vidhan152.playlistTracker.entity.User;
import com.vidhan152.playlistTracker.entity.Video;
import com.vidhan152.playlistTracker.exception.RateLimitExceededException;
import com.vidhan152.playlistTracker.repository.PlaylistRepository;
import com.vidhan152.playlistTracker.util.YoutubeUrlParser;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final YoutubeClient youtubeClient;
    private final RateLimiterService rateLimiterService;

    @Transactional
    public PlaylistDetailResponse addPlaylist(AddPlaylistRequest request, User user) {
        log.info("User [{}] adding playlist from URL: {}", user.getId(), request.getPlaylistUrl());
        checkRateLimit(user);

        String playlistId = YoutubeUrlParser.extractPlaylistId(request.getPlaylistUrl());
        log.debug("Extracted YouTube playlist ID: {}", playlistId);

        YoutubePlaylistDto fetched = youtubeClient.fetchPlaylist(playlistId);
        log.info("Fetched playlist '{}' with {} videos for user [{}]",
                fetched.getTitle(), fetched.getVideos().size(), user.getId());

        Playlist playlist = Playlist.builder()
                .user(user)
                .youtubePlaylistId(fetched.getYoutubePlaylistId())
                .title(fetched.getTitle())
                .thumbnailUrl(fetched.getThumbnailUrl())
                .build();

        for (YoutubeVideoDto videoDto : fetched.getVideos()) {
            Video video = Video.builder()
                    .playlist(playlist)
                    .youtubeVideoId(videoDto.getYoutubeVideoId())
                    .title(videoDto.getTitle())
                    .thumbnailUrl(videoDto.getThumbnailUrl())
                    .durationSeconds(videoDto.getDurationSeconds())
                    .position(videoDto.getPosition())
                    .completed(false)
                    .build();
            playlist.getVideos().add(video);
        }

        Playlist saved = playlistRepository.save(playlist);
        log.info("Saved playlist [id={}] '{}' for user [{}]", saved.getId(), saved.getTitle(), user.getId());
        return toDetailResponse(saved);
    }

    public List<PlaylistSummaryResponse> getPlaylistsForUser(User user) {
        log.debug("Fetching all playlists for user [{}]", user.getId());
        List<PlaylistSummaryResponse> result = playlistRepository.findByUser(user).stream()
                .map(this::toSummaryResponse)
                .toList();
        log.debug("Found {} playlists for user [{}]", result.size(), user.getId());
        return result;
    }

    public PlaylistDetailResponse getPlaylistDetail(Long playlistId, User user) {
        log.debug("Fetching playlist detail [id={}] for user [{}]", playlistId, user.getId());
        Playlist playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> {
                    log.warn("Playlist [id={}] not found for user [{}]", playlistId, user.getId());
                    return new EntityNotFoundException("Playlist not found");
                });
        return toDetailResponse(playlist);
    }

    @Transactional
    public void deletePlaylist(Long playlistId, User user) {
        log.info("User [{}] deleting playlist [id={}]", user.getId(), playlistId);
        Playlist playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> {
                    log.warn("Delete failed — playlist [id={}] not found for user [{}]", playlistId, user.getId());
                    return new EntityNotFoundException("Playlist not found");
                });
        playlistRepository.delete(playlist);
        log.info("Deleted playlist [id={}] for user [{}]", playlistId, user.getId());
    }

    @Transactional
    public PlaylistDetailResponse syncPlaylist(Long playlistId, User user) {
        log.info("User [{}] syncing playlist [id={}]", user.getId(), playlistId);
        checkRateLimit(user);

        Playlist playlist = playlistRepository.findByIdAndUser(playlistId, user)
                .orElseThrow(() -> {
                    log.warn("Sync failed — playlist [id={}] not found for user [{}]", playlistId, user.getId());
                    return new EntityNotFoundException("Playlist not found");
                });

        YoutubePlaylistDto fetched = youtubeClient.fetchPlaylist(playlist.getYoutubePlaylistId());
        log.info("Sync fetched '{}' with {} videos", fetched.getTitle(), fetched.getVideos().size());

        var existingByYoutubeId = playlist.getVideos().stream()
                .collect(java.util.stream.Collectors.toMap(Video::getYoutubeVideoId, v -> v));

        int previousCount = playlist.getVideos().size();
        playlist.getVideos().clear();

        for (YoutubeVideoDto videoDto : fetched.getVideos()) {
            Video existing = existingByYoutubeId.get(videoDto.getYoutubeVideoId());
            Video video = Video.builder()
                    .playlist(playlist)
                    .youtubeVideoId(videoDto.getYoutubeVideoId())
                    .title(videoDto.getTitle())
                    .thumbnailUrl(videoDto.getThumbnailUrl())
                    .durationSeconds(videoDto.getDurationSeconds())
                    .position(videoDto.getPosition())
                    .completed(existing != null && existing.isCompleted())
                    .build();
            playlist.getVideos().add(video);
        }

        int newCount = fetched.getVideos().size();
        if (newCount != previousCount) {
            log.info("Playlist [id={}] video count changed: {} → {}", playlistId, previousCount, newCount);
        }

        playlist.setTitle(fetched.getTitle());
        playlist.setThumbnailUrl(fetched.getThumbnailUrl());
        playlist.setLastSyncedAt(LocalDateTime.now());

        Playlist saved = playlistRepository.save(playlist);
        log.info("Sync complete for playlist [id={}] '{}' — {} videos", saved.getId(), saved.getTitle(), newCount);
        return toDetailResponse(saved);
    }

    // ----- mapping helpers -----

    private PlaylistSummaryResponse toSummaryResponse(Playlist playlist) {
        StatsResponse stats = computeStats(playlist.getVideos());
        return PlaylistSummaryResponse.builder()
                .id(playlist.getId())
                .youtubePlaylistId(playlist.getYoutubePlaylistId())
                .title(playlist.getTitle())
                .thumbnailUrl(playlist.getThumbnailUrl())
                .totalVideos(stats.getTotalVideos())
                .completedVideos(stats.getCompletedVideos())
                .totalDurationSeconds(stats.getTotalDurationSeconds())
                .completedDurationSeconds(stats.getCompletedDurationSeconds())
                .build();
    }

    private PlaylistDetailResponse toDetailResponse(Playlist playlist) {
        List<VideoResponse> videoResponses = playlist.getVideos().stream()
                .sorted((a, b) -> Integer.compare(a.getPosition(), b.getPosition()))
                .map(v -> VideoResponse.builder()
                        .id(v.getId())
                        .youtubeVideoId(v.getYoutubeVideoId())
                        .title(v.getTitle())
                        .position(v.getPosition())
                        .durationSeconds(v.getDurationSeconds())
                        .thumbnailUrl(v.getThumbnailUrl())
                        .completed(v.isCompleted())
                        .build())
                .toList();

        return PlaylistDetailResponse.builder()
                .id(playlist.getId())
                .youtubePlaylistId(playlist.getYoutubePlaylistId())
                .title(playlist.getTitle())
                .thumbnailUrl(playlist.getThumbnailUrl())
                .lastSyncedAt(playlist.getLastSyncedAt())
                .stats(computeStats(playlist.getVideos()))
                .videos(videoResponses)
                .build();
    }

    private StatsResponse computeStats(List<Video> videos) {
        int total = videos.size();
        int completed = (int) videos.stream().filter(Video::isCompleted).count();
        long totalDuration = videos.stream().mapToLong(Video::getDurationSeconds).sum();
        long completedDuration = videos.stream()
                .filter(Video::isCompleted)
                .mapToLong(Video::getDurationSeconds)
                .sum();
        double percent = total == 0 ? 0.0 : (completed * 100.0) / total;

        return StatsResponse.builder()
                .totalVideos(total)
                .completedVideos(completed)
                .totalDurationSeconds(totalDuration)
                .completedDurationSeconds(completedDuration)
                .remainingDurationSeconds(totalDuration - completedDuration)
                .percentComplete(Math.round(percent * 10) / 10.0)
                .build();
    }

    private void checkRateLimit(User user) {
        var bucket = rateLimiterService.resolveBucket(user.getId());
        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit hit for user [{}]", user.getId());
            throw new RateLimitExceededException(
                    "You've reached the limit for playlist operations. Please try again later.");
        }
    }
}