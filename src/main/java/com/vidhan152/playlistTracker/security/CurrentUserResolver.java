package com.vidhan152.playlistTracker.security;

import com.vidhan152.playlistTracker.entity.User;
import com.vidhan152.playlistTracker.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserResolver {

    private final UserRepository userRepository;

    public User resolve(OAuth2User principal) {
        String googleId = principal.getAttribute("sub");
        return userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }
}