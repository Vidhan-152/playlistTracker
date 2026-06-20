package com.vidhan152.playlistTracker.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class RateLimiterService {

    private final ConcurrentMap<Long, Bucket> userBuckets = new ConcurrentHashMap<>();

    public Bucket resolveBucket(Long userId) {
        return userBuckets.computeIfAbsent(userId, id -> newBucket());
    }

    private Bucket newBucket() {
        // Allow 10 YouTube-calling requests per hour per user
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(10, Duration.ofHours(1)));
        return Bucket.builder().addLimit(limit).build();
    }
}