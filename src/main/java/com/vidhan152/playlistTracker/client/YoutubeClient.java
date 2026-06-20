package com.vidhan152.playlistTracker.client;

import com.vidhan152.playlistTracker.dto.YoutubePlaylistDto;
import com.vidhan152.playlistTracker.dto.YoutubeVideoDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class YoutubeClient {

    private final RestClient restClient;

    @Value("${youtube.api.key}")
    private String apiKey;

    @Value("${youtube.api.base-url}")
    private String baseUrl;

    public YoutubePlaylistDto fetchPlaylist(String playlistId) {
        // Step 1: get playlist metadata (title, thumbnail)
        log.info("Fetching playlist metadata for playlistId: {}", playlistId);

        Map<String, Object> playlistResponse = restClient.get()
                .uri(baseUrl + "/playlists?part=snippet&id={id}&key={key}", playlistId, apiKey)
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> playlistItems = (List<Map<String, Object>>) playlistResponse.get("items");
        if (playlistItems == null || playlistItems.isEmpty()) {
            log.warn("No playlist found for playlistId: {} — may be private or invalid", playlistId);
            throw new IllegalArgumentException("Playlist not found or is private: " + playlistId);
        }

        Map<String, Object> playlistSnippet = (Map<String, Object>) playlistItems.get(0).get("snippet");
        String playlistTitle = (String) playlistSnippet.get("title");
        String playlistThumbnail = extractThumbnail(playlistSnippet);
        log.debug("Playlist metadata resolved — title: '{}', thumbnail: {}", playlistTitle, playlistThumbnail);

        // Step 2: get all video IDs + positions + titles via playlistItems (paginated)
        List<YoutubeVideoDto> videos = new ArrayList<>();
        String nextPageToken = null;
        int position = 0;
        int pageNumber = 0;

        do {
            pageNumber++;
            String url = baseUrl + "/playlistItems?part=snippet&maxResults=50&playlistId={playlistId}&key={key}"
                    + (nextPageToken != null ? "&pageToken=" + nextPageToken : "");

            log.debug("Fetching playlist items — page {}, playlistId: {}", pageNumber, playlistId);

            Map<String, Object> itemsResponse = restClient.get()
                    .uri(url, playlistId, apiKey)
                    .retrieve()
                    .body(Map.class);

            List<Map<String, Object>> items = (List<Map<String, Object>>) itemsResponse.get("items");
            log.debug("Page {} returned {} items", pageNumber, items.size());

            for (Map<String, Object> item : items) {
                Map<String, Object> snippet = (Map<String, Object>) item.get("snippet");
                Map<String, Object> resourceId = (Map<String, Object>) snippet.get("resourceId");
                String videoId = (String) resourceId.get("videoId");

                videos.add(YoutubeVideoDto.builder()
                        .youtubeVideoId(videoId)
                        .title((String) snippet.get("title"))
                        .thumbnailUrl(extractThumbnail(snippet))
                        .position(position++)
                        .durationSeconds(0)
                        .build());
            }

            nextPageToken = (String) itemsResponse.get("nextPageToken");
        } while (nextPageToken != null);

        log.info("Finished fetching playlist items — {} videos total across {} page(s)", videos.size(), pageNumber);

        // Step 3: fetch durations in batches of 50
        attachDurations(videos);

        return YoutubePlaylistDto.builder()
                .youtubePlaylistId(playlistId)
                .title(playlistTitle)
                .thumbnailUrl(playlistThumbnail)
                .videos(videos)
                .build();
    }

    private void attachDurations(List<YoutubeVideoDto> videos) {
        int totalBatches = (int) Math.ceil(videos.size() / 50.0);
        log.debug("Attaching durations — {} video(s), {} batch(es)", videos.size(), totalBatches);

        for (int i = 0; i < videos.size(); i += 50) {
            List<YoutubeVideoDto> batch = videos.subList(i, Math.min(i + 50, videos.size()));
            int batchNumber = (i / 50) + 1;
            String idsParam = String.join(",", batch.stream().map(YoutubeVideoDto::getYoutubeVideoId).toList());

            log.debug("Fetching durations — batch {}/{} ({} videos)", batchNumber, totalBatches, batch.size());

            Map<String, Object> response = restClient.get()
                    .uri(baseUrl + "/videos?part=contentDetails&id={ids}&key={key}", idsParam, apiKey)
                    .retrieve()
                    .body(Map.class);

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");

            for (Map<String, Object> item : items) {
                String videoId = (String) item.get("id");
                Map<String, Object> contentDetails = (Map<String, Object>) item.get("contentDetails");
                String isoDuration = (String) contentDetails.get("duration");
                long seconds = Duration.parse(isoDuration).getSeconds();

                batch.stream()
                        .filter(v -> v.getYoutubeVideoId().equals(videoId))
                        .findFirst()
                        .ifPresent(v -> v.setDurationSeconds(seconds));
            }

            log.debug("Duration batch {}/{} complete", batchNumber, totalBatches);
        }

        log.info("Duration attachment complete for {} video(s)", videos.size());
    }

    private String extractThumbnail(Map<String, Object> snippet) {
        Map<String, Object> thumbnails = (Map<String, Object>) snippet.get("thumbnails");
        if (thumbnails == null) return null;
        Map<String, Object> defaultThumb = (Map<String, Object>) thumbnails.get("default");
        return defaultThumb != null ? (String) defaultThumb.get("url") : null;
    }
}