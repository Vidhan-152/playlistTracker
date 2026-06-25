package com.vidhan152.playlistTracker.controller;

import com.vidhan152.playlistTracker.entity.Note;
import com.vidhan152.playlistTracker.security.CurrentUserResolver;
import com.vidhan152.playlistTracker.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping("/{id}/notes/generate")
    public ResponseEntity<?> generateNotes(@PathVariable Long id,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Note note = noteService.generateNotes(id, currentUserResolver.resolve(userDetails));
            return ResponseEntity.ok(Map.of(
                    "content", note.getContent(),
                    "generatedAt", note.getGeneratedAt().toString()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<?> getNotes(@PathVariable Long id,
                                      @AuthenticationPrincipal UserDetails userDetails) {
        return noteService.getNotes(id, currentUserResolver.resolve(userDetails))
                .map(note -> ResponseEntity.ok(Map.of(
                        "content", note.getContent(),
                        "generatedAt", note.getGeneratedAt().toString()
                )))
                .orElse(ResponseEntity.noContent().build());
    }
}