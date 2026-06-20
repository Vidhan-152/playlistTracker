package com.vidhan152.playlistTracker.controller;

import com.vidhan152.playlistTracker.dto.request.AddPlaylistRequest;
import com.vidhan152.playlistTracker.dto.response.PlaylistDetailResponse;
import com.vidhan152.playlistTracker.dto.response.PlaylistSummaryResponse;
import com.vidhan152.playlistTracker.security.CurrentUserResolver;
import com.vidhan152.playlistTracker.service.PlaylistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistService playlistService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlaylistDetailResponse addPlaylist(@Valid @RequestBody AddPlaylistRequest request,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        return playlistService.addPlaylist(request, currentUserResolver.resolve(userDetails));
    }

    @GetMapping
    public List<PlaylistSummaryResponse> getPlaylists(@AuthenticationPrincipal UserDetails userDetails) {
        return playlistService.getPlaylistsForUser(currentUserResolver.resolve(userDetails));
    }

    @GetMapping("/{id}")
    public PlaylistDetailResponse getPlaylistDetail(@PathVariable Long id,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        return playlistService.getPlaylistDetail(id, currentUserResolver.resolve(userDetails));
    }

    @PostMapping("/{id}/sync")
    public PlaylistDetailResponse syncPlaylist(@PathVariable Long id,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        return playlistService.syncPlaylist(id, currentUserResolver.resolve(userDetails));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlaylist(@PathVariable Long id,
                               @AuthenticationPrincipal UserDetails userDetails) {
        playlistService.deletePlaylist(id, currentUserResolver.resolve(userDetails));
    }
}