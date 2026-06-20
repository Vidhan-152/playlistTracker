package com.vidhan152.playlistTracker.service;

import com.vidhan152.playlistTracker.dto.request.UpdateProgressRequest;
import com.vidhan152.playlistTracker.entity.User;
import com.vidhan152.playlistTracker.entity.Video;
import com.vidhan152.playlistTracker.repository.VideoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoService {

    private final VideoRepository videoRepository;

    @Transactional
    public void updateProgress(Long videoId, UpdateProgressRequest request, User user) {
        log.debug("User [{}] updating progress for video [id={}] — completed: {}",
                user.getId(), videoId, request.isCompleted());

        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> {
                    log.warn("Video [id={}] not found", videoId);
                    return new EntityNotFoundException("Video not found");
                });

        if (!video.getPlaylist().getUser().getId().equals(user.getId())) {
            log.warn("Access denied — user [{}] attempted to update video [id={}] owned by user [{}]",
                    user.getId(), videoId, video.getPlaylist().getUser().getId());
            throw new AccessDeniedException("You do not have access to this video");
        }

        video.setCompleted(request.isCompleted());
        videoRepository.save(video);
        log.info("Video [id={}] marked {} by user [{}]",
                videoId, request.isCompleted() ? "completed" : "incomplete", user.getId());
    }
}