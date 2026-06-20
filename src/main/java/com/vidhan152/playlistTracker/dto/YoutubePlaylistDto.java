package com.vidhan152.playlistTracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YoutubePlaylistDto {
    private String youtubePlaylistId;
    private String title;
    private String thumbnailUrl;
    private List<YoutubeVideoDto> videos;
}