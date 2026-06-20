package com.vidhan152.playlistTracker.controller;

import com.vidhan152.playlistTracker.entity.User;
import com.vidhan152.playlistTracker.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");

        if (email == null || password == null || name == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "email, password and name are required"));
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .name(name)
                .build();
        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body,
                                   HttpSession session) {
        String email = body.get("email");
        String password = body.get("password");

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
            SecurityContext sc = SecurityContextHolder.getContext();
            sc.setAuthentication(auth);
            session.setAttribute("SPRING_SECURITY_CONTEXT", sc);

            User user = userRepository.findByEmail(email).orElseThrow();
            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName()
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        SecurityContext sc = (SecurityContext) session.getAttribute("SPRING_SECURITY_CONTEXT");
        if (sc == null || sc.getAuthentication() == null || !sc.getAuthentication().isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not logged in"));
        }
        String email = sc.getAuthentication().getName();
        return userRepository.findByEmail(email)
                .map(u -> ResponseEntity.ok(Map.of(
                        "id", u.getId(),
                        "email", u.getEmail(),
                        "name", u.getName()
                )))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not found")));
    }
}