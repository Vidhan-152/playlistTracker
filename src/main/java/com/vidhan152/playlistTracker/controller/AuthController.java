package com.vidhan152.playlistTracker.controller;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Objects;

@RestController
public class AuthController {

    @GetMapping("/api/auth/me")
    public Map<String, Object> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        return Map.of(
                "name", Objects.requireNonNull(principal.getAttribute("name")),
                "email", Objects.requireNonNull(principal.getAttribute("email")),
                "picture", Objects.requireNonNull(principal.getAttribute("picture"))
        );
    }
}