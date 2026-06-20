package com.vidhan152.playlistTracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoResponse {
    private Long id;
    private String youtubeVideoId;
    private String title;
    private int position;
    private long durationSeconds;
    private String thumbnailUrl;
    private boolean completed;
}