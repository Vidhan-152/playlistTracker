package com.vidhan152.playlistTracker.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TranscriptService {

    private final RestClient restClient;

    @Value("${transcript.service.url}")
    private String transcriptServiceUrl;

    @Value("${transcript.service.secret}")
    private String transcriptServiceSecret;

    public String fetchTranscript(String youtubeVideoId) {
        log.info("Fetching transcript for video: {}", youtubeVideoId);

        try {
            Map response = restClient.get()
                    .uri(transcriptServiceUrl + "/transcript/{id}", youtubeVideoId)
                    .header("X-Transcript-Secret", transcriptServiceSecret)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        throw new IllegalArgumentException("No captions available for video: " + youtubeVideoId);
                    })
                    .body(Map.class);

            if (response == null || !response.containsKey("transcript")) {
                throw new IllegalStateException("Empty transcript response for video: " + youtubeVideoId);
            }

            String transcript = (String) response.get("transcript");
            log.info("Transcript fetched for video {} — {} characters", youtubeVideoId, transcript.length());
            return transcript;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch transcript for video {}: {}", youtubeVideoId, e.getMessage());
            throw new IllegalStateException("Failed to fetch transcript for video: " + youtubeVideoId);
        }
    }
}