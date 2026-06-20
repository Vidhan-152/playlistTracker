package com.vidhan152.playlistTracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddPlaylistRequest {

    @NotBlank(message = "Playlist URL is required")
    private String playlistUrl;
}