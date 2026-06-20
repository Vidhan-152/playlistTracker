package com.vidhan152.playlistTracker.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class YoutubeUrlParser {

    private static final Pattern PLAYLIST_ID_PATTERN = Pattern.compile("list=([a-zA-Z0-9_-]+)");

    public static String extractPlaylistId(String url) {
        Matcher matcher = PLAYLIST_ID_PATTERN.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new IllegalArgumentException("Invalid YouTube playlist URL: could not extract playlist ID");
    }
}