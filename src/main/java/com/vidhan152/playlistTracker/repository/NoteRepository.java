package com.vidhan152.playlistTracker.repository;

import com.vidhan152.playlistTracker.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {
    Optional<Note> findByVideoId(Long videoId);
}