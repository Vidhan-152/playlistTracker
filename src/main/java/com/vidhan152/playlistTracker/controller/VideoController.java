package com.vidhan152.playlistTracker.controller;

import com.vidhan152.playlistTracker.dto.request.UpdateProgressRequest;
import com.vidhan152.playlistTracker.security.CurrentUserResolver;
import com.vidhan152.playlistTracker.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;
    private final CurrentUserResolver currentUserResolver;

    @PatchMapping("/api/videos/{id}/progress")
    public void updateProgress(@PathVariable Long id,
                               @RequestBody UpdateProgressRequest request,
                               @AuthenticationPrincipal OAuth2User principal) {
        videoService.updateProgress(id, request, currentUserResolver.resolve(principal));
    }
}