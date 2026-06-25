package com.vidhan152.playlistTracker.service;

import com.vidhan152.playlistTracker.entity.Note;
import com.vidhan152.playlistTracker.entity.User;
import com.vidhan152.playlistTracker.entity.Video;
import com.vidhan152.playlistTracker.repository.NoteRepository;
import com.vidhan152.playlistTracker.repository.VideoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final VideoRepository videoRepository;
    private final TranscriptService transcriptService;
    private final RestClient restClient;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.base-url}")
    private String groqBaseUrl;

    public Note generateNotes(Long videoId, User user) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new EntityNotFoundException("Video not found"));

        // Ownership check
        if (!video.getPlaylist().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have access to this video");
        }

        log.info("Generating notes for video [id={}] '{}'", videoId, video.getTitle());

        // Fetch transcript
        String transcript = transcriptService.fetchTranscript(video.getYoutubeVideoId());

        // Truncate transcript if too long (Groq has token limits)
        if (transcript.length() > 12000) {
            transcript = transcript.substring(0, 12000);
            log.debug("Transcript truncated to 12000 chars for video [id={}]", videoId);
        }

        // Call Groq
        String notes = callGroq(video.getTitle(), transcript);

        // Save or update existing note
        Optional<Note> existing = noteRepository.findByVideoId(videoId);
        Note note = existing.orElse(Note.builder().video(video).build());
        note.setContent(notes);

        Note saved = noteRepository.save(note);
        log.info("Notes saved for video [id={}]", videoId);
        return saved;
    }

    public Optional<Note> getNotes(Long videoId, User user) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new EntityNotFoundException("Video not found"));

        if (!video.getPlaylist().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have access to this video");
        }

        return noteRepository.findByVideoId(videoId);
    }

    private String callGroq(String videoTitle, String transcript) {
        log.info("Calling Groq API for note generation");

        String prompt = """
                You are a study notes assistant. Based on the following video transcript, generate clear and structured study notes.
                
                Video Title: %s
                
                Transcript:
                %s
                
                Generate notes in this format:
                ## Summary
                (2-3 sentence overview)
                
                ## Key Concepts
                (bullet points of main ideas)
                
                ## Important Details
                (bullet points of specific facts, examples, or details worth remembering)
                
                ## Takeaways
                (1-3 actionable takeaways or things to remember)
                """.formatted(videoTitle, transcript);

        Map<String, Object> requestBody = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(
                        Map.of("role", "user", "content", prompt)
                ),
                "max_tokens", 1024,
                "temperature", 0.3
        );

        Map response = restClient.post()
                .uri(groqBaseUrl + "/chat/completions")
                .header("Authorization", "Bearer " + groqApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        List<Map> choices = (List<Map>) response.get("choices");
        Map message = (Map) choices.get(0).get("message");
        String content = (String) message.get("content");

        log.info("Groq API returned notes successfully");
        return content;
    }
}