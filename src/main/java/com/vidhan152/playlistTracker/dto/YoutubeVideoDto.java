package com.vidhan152.playlistTracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YoutubeVideoDto {
    private String youtubeVideoId;
    private String title;
    private String thumbnailUrl;
    private long durationSeconds;
    private int position;
}