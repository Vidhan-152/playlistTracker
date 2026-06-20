package com.vidhan152.playlistTracker.repository;

import com.vidhan152.playlistTracker.entity.Video;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoRepository extends JpaRepository<Video, Long> {
}