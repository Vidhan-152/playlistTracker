package com.vidhan152.playlistTracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaylistDetailResponse {
    private Long id;
    private String youtubePlaylistId;
    private String title;
    private String thumbnailUrl;
    private LocalDateTime lastSyncedAt;
    private StatsResponse stats;
    private List<VideoResponse> videos;
}