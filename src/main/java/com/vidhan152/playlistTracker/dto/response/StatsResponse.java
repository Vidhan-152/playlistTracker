package com.vidhan152.playlistTracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatsResponse {
    private int totalVideos;
    private int completedVideos;
    private long totalDurationSeconds;
    private long completedDurationSeconds;
    private long remainingDurationSeconds;
    private double percentComplete;
}