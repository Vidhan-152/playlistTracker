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
        String notes = callGroq(video.getPlaylist().getTitle(), video.getTitle(), transcript);

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

    public Note updateNotes(Long videoId, String newContent, User user) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new EntityNotFoundException("Video not found"));

        if (!video.getPlaylist().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have access to this video");
        }

        Note note = noteRepository.findByVideoId(videoId)
                .orElseThrow(() -> new IllegalArgumentException("No notes exist yet for this video"));

        note.setContent(newContent);
        Note saved = noteRepository.save(note);
        log.info("Notes manually updated for video [id={}]", videoId);
        return saved;
    }

    private String callGroq(String playlistName,String videoTitle, String transcript) {
        log.info("Calling Groq API for note generation");

        String prompt = """
            You are an expert educator, technical writer, and study-notes assistant.
            
            Your task is to convert a YouTube lecture transcript into comprehensive, well-structured study notes.
            
            Context:
            
            Playlist: %s
            
            Video Title: %s
            
            Transcript:
            
            %s
            
            Instructions:
            
            - Produce notes that a student can directly study from without watching the lecture again.
            - Ignore greetings, introductions, jokes, advertisements, sponsor messages, repeated explanations, and conversational filler.
            - Focus only on educational content.
            - Rewrite the transcript into clean, concise, professional English.
            - Never copy large portions of the transcript verbatim.
            - Preserve all important technical concepts.
            - Maintain technical accuracy at all times.
            - Organize the content logically instead of following the exact transcript order whenever appropriate.
            - Remove duplicate explanations while preserving all useful information.
            
            Formulas and Equations (VERY IMPORTANT):
            
            Whenever the lecture contains any mathematical formula, equation, theorem, identity, derivation, algorithm, complexity, syntax rule, or expression:
            
            - Write it exactly as presented.
            - Never omit any important formula.
            - Explain every variable or symbol.
            - Explain where the formula is used.
            - Explain why it is useful.
            - Mention assumptions or conditions if applicable.
            - Mention shortcuts or tricks discussed by the instructor.
            - Preserve mathematical notation correctly.
            
            If programming concepts are discussed:
            
            - Explain the algorithm.
            - Mention time complexity.
            - Mention space complexity.
            - Explain the intuition.
            - Mention important edge cases.
            - Mention common interview questions if applicable.
            
            If examples are discussed:
            
            - Summarize the example.
            - Explain what concept the example demonstrates.
            
            Generate the notes in the following Markdown format.
            
            # 📘 Overview
            
            Write a concise overview (3–5 sentences).
            
            ---
            
            # 🧠 Core Concepts
            
            List every major concept covered.
            
            ---
            
            # 📖 Detailed Notes
            
            Explain every important concept using headings and bullet points.
            
            ---
            
            # 🧮 Formulae / Equations
            
            Include ALL important formulas.
            
            For each formula include:
            
            - Formula
            - Meaning of variables
            - When to use it
            - Explanation
            - Important observations
            
            If no formulas are present, explicitly write:
            
            "No important formulas were discussed in this lecture."
            
            ---
            
            # 💡 Important Points
            
            Mention tricks, properties, observations, shortcuts, interview points, exam points and special cases.
            
            ---
            
            # ⚠️ Common Mistakes
            
            Mention mistakes students should avoid.
            
            If none are explicitly mentioned, infer the most likely mistakes based on the topic.
            
            ---
            
            # 🎯 Revision Notes
            
            Provide quick revision bullets that can be read in one minute.
            
            ---
            
            # ❓ Practice Questions
            
            Generate five conceptual questions based only on this lecture.
            
            Do not provide answers.
            
            ---
            
            # ✅ Key Takeaways
            
            List the most important things a student should remember after completing this lecture.
            
            Rules:
            
            - Never invent facts that are not supported by the transcript.
            - Prefer bullet points over long paragraphs.
            - Use proper Markdown formatting.
            - Produce notes that are clean, professional, and suitable for long-term revision.
            """.formatted(
                playlistName,
                videoTitle,
                transcript
        );

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