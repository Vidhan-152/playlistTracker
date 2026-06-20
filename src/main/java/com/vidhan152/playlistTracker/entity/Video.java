package com.vidhan152.playlistTracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "videos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @Column(nullable = false)
    private String youtubeVideoId;

    @Column(nullable = false, length = 500)
    private String title;

    private String thumbnailUrl;

    @Column(nullable = false)
    private long durationSeconds;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    @Builder.Default
    private boolean completed = false;
}