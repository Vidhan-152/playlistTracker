# 🎬 TrackTube

> AI-powered YouTube playlist learning tracker. Track progress, generate study notes, and chat with your lectures.

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-brightgreen)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-teal)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-blue)](https://github.com/pgvector/pgvector)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [AI Pipeline](#ai-pipeline)
- [RAG System](#rag-system)
- [Cloudflare Tunnel Setup](#cloudflare-tunnel-setup)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Key Engineering Decisions](#key-engineering-decisions)

---

## Overview

TrackTube is a full-stack learning platform that turns YouTube playlists into structured study environments. Users paste a playlist URL, TrackTube syncs all videos, tracks completion progress, generates AI study notes from lecture transcripts, and supports RAG-powered playlist-level chat grounded in actual video content.

**Core features:**
- YouTube playlist sync and progress tracking
- Per-video AI notes generated via Groq Llama 3.3 70B
- Playlist-level RAG chat (ask questions across all videos)
- Edit, print, and save AI-generated notes as PDF
- Light/dark theme, mobile responsive
- Session-based authentication

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | `https://tracktube.vercel.app` |
| Spring Backend | `https://playlisttracker-production.up.railway.app` |
| FastAPI Transcript Service | `https://transcript.YOURDOMAIN.TLD` (Cloudflare Tunnel → localhost) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                    tracktube.vercel.app                         │
│                     React + Vite (SPA)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS (Axios, withCredentials)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SPRING BOOT BACKEND (Railway)                   │
│           playlisttracker-production.up.railway.app             │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ AuthController│  │PlaylistController│  │  NoteController  │  │
│  └─────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              PlaylistEmbeddingService                    │   │
│  │     (orchestrates first-2-sync + rest-async flow)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐    │
│  │TranscriptService│  │  NoteService  │  │PlaylistChatService│   │
│  └───────┬───────┘  └───────┬───────┘  └────────┬─────────┘    │
└──────────┼───────────────── ┼────────────────────┼─────────────┘
           │                  │ (Groq API)          │
           │ HTTP (RestClient)│                     │ HTTP (RestClient)
           ▼                  ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│           FASTAPI TRANSCRIPT SERVICE (Your Laptop)               │
│              transcript.YOURDOMAIN.TLD                           │
│              via Cloudflare Named Tunnel                         │
│                                                                  │
│  GET  /transcript/{video_id}  → YouTube transcript fetch        │
│  POST /embed/video            → chunk + embed + store pgvector  │
│  POST /chat/playlist          → RAG chat pipeline               │
│  GET  /chat/playlist/{id}/history → fetch conversation          │
│  DELETE /embed/playlist/{id}  → cleanup on playlist delete      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  youtube-transcript-api → YouTube (residential IP = OK)  │   │
│  │  google-generativeai   → Google text-embedding-004       │   │
│  │  psycopg2 + pgvector   → Railway PostgreSQL (direct)     │   │
│  │  httpx                 → Groq LLM API                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
           │                                        │
           ▼ YouTube Data API                       ▼ pgvector writes
┌──────────────────┐              ┌─────────────────────────────────┐
│  YouTube APIs    │              │   PostgreSQL + pgvector          │
│  (video metadata │              │   (Railway managed Postgres)     │
│   transcript)    │              │                                  │
└──────────────────┘              │  tables: users, playlists,       │
                                  │  videos, notes, transcript_chunks│
                                  │  playlist_chat_messages          │
                                  └─────────────────────────────────┘
```

### Why Two Backend Services?

YouTube blocks transcript requests from known datacenter IP ranges (AWS, GCP, Railway, etc.). The FastAPI service runs on a **residential home IP** (your laptop) which YouTube doesn't block. A Cloudflare Named Tunnel exposes it to the internet with a stable HTTPS URL. Spring Boot routes transcript and embedding calls through this tunnel, while handling all business logic, authentication, and database ORM itself.

---

## File Structure

```
playlistTracker/
│
├── src/                                          # Spring Boot (Java)
│   └── main/java/com/vidhan152/playlistTracker/
│       ├── config/
│       │   ├── SecurityConfig.java               # CORS, session auth, permitAll rules
│       │   └── RestClientConfig.java             # RestClient bean
│       ├── controller/
│       │   ├── AuthController.java               # /api/auth/*
│       │   ├── PlaylistController.java           # /api/playlists/*
│       │   ├── VideoController.java              # /api/videos/*
│       │   ├── NoteController.java               # /api/videos/{id}/notes/*
│       │   └── PlaylistChatController.java       # /api/playlists/{id}/chat
│       ├── entity/
│       │   ├── User.java
│       │   ├── Playlist.java                     # includes embeddingStatus field
│       │   ├── Video.java
│       │   ├── Note.java
│       │   ├── TranscriptChunk.java              # vector(768) embedding column
│       │   └── PlaylistChatMessage.java
│       ├── enums/
│       │   └── EmbeddingStatus.java              # NONE → PARTIAL → READY → FAILED
│       ├── repository/
│       │   ├── UserRepository.java
│       │   ├── PlaylistRepository.java
│       │   ├── VideoRepository.java
│       │   ├── NoteRepository.java
│       │   ├── TranscriptChunkRepository.java
│       │   └── PlaylistChatMessageRepository.java
│       ├── service/
│       │   ├── PlaylistService.java              # sync, add, delete playlists
│       │   ├── NoteService.java                  # generate/get/update notes via Groq
│       │   ├── TranscriptService.java            # calls FastAPI tunnel for transcripts
│       │   ├── PlaylistEmbeddingService.java     # first-2-sync + async background embed
│       │   └── PlaylistChatService.java          # delegates RAG chat to FastAPI
│       ├── security/
│       │   └── CurrentUserResolver.java
│       └── exception/
│           └── GlobalExceptionHandler.java
│
├── pom.xml                                       # pgvector, H2 test deps added
├── Dockerfile
├── application.yml                               # all config with env var fallbacks
│
└── transcript-server/                            # FastAPI (Python) — runs on laptop
    ├── main.py                                   # all FastAPI endpoints
    ├── requirements.txt
    ├── Dockerfile                                # used when it was on Railway
    ├── railway.json                              # start command config
    └── .gitignore                               # excludes venv/, .env
```

### Frontend (separate Vercel deployment)

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js                 # axios instance (baseURL from env, withCredentials)
│   ├── components/
│   │   ├── LandingPage.jsx           # responsive landing with hero, features, FAQ
│   │   ├── Sidebar.jsx               # playlist list, add/delete, mini stats
│   │   ├── PlaylistDetail.jsx        # progress card, video list, AI drawer layout
│   │   ├── VideoItem.jsx             # per-video row with Watch / Notes buttons
│   │   └── AIDrawer.jsx             # notes drawer (edit, print, markdown render)
│   ├── hooks/
│   │   └── useWindowSize.js          # isMobile breakpoint hook
│   ├── App.jsx                       # routing, theme, auth state
│   └── App.css                       # keyframes, markdown styles, scrollbar
├── .env.development
├── .env.production
└── vite.config.js
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Playlists (one copy per user, not shared)
CREATE TABLE playlists (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    youtube_playlist_id VARCHAR(255) NOT NULL,
    title            VARCHAR(500),
    thumbnail_url    VARCHAR(500),
    embedding_status VARCHAR(20) DEFAULT 'NONE',  -- NONE|PARTIAL|READY|FAILED
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

-- Videos (per playlist copy, not shared)
CREATE TABLE videos (
    id                BIGSERIAL PRIMARY KEY,
    playlist_id       BIGINT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    youtube_video_id  VARCHAR(50) NOT NULL,
    title             VARCHAR(500),
    thumbnail_url     VARCHAR(500),
    duration_seconds  INT DEFAULT 0,
    position          INT NOT NULL,
    completed         BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- AI Notes (one note per video, regeneratable)
CREATE TABLE notes (
    id           BIGSERIAL PRIMARY KEY,
    video_id     BIGINT UNIQUE NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,        -- stored as raw Markdown
    generated_at TIMESTAMP NOT NULL
);

-- pgvector extension (run once on Railway)
CREATE EXTENSION IF NOT EXISTS vector;

-- Transcript chunks for RAG
CREATE TABLE transcript_chunks (
    id          BIGSERIAL PRIMARY KEY,
    playlist_id BIGINT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    video_id    BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content     TEXT NOT NULL,
    embedding   vector(768) NOT NULL,  -- Google text-embedding-004 output
    created_at  TIMESTAMP DEFAULT NOW()
);

-- IVFFlat index for fast cosine similarity search
CREATE INDEX idx_chunks_embedding
    ON transcript_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Playlist-level chat history (per user, per playlist)
CREATE TABLE playlist_chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    playlist_id BIGINT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL,  -- 'user' | 'assistant'
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, sets session cookie |
| `POST` | `/api/auth/logout` | Invalidate session |
| `GET` | `/api/auth/me` | Get current authenticated user |

### Playlists (`/api/playlists`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/playlists` | List all playlists for current user |
| `POST` | `/api/playlists` | Add playlist by URL, triggers embedding Phase 1 |
| `GET` | `/api/playlists/{id}` | Get playlist detail with all videos + stats |
| `DELETE` | `/api/playlists/{id}` | Delete playlist + all chunks |
| `POST` | `/api/playlists/{id}/sync` | Re-sync playlist with YouTube |
| `GET` | `/api/playlists/{id}/embedding-status` | Get current embedding status |

### Videos (`/api/videos`)

| Method | Path | Description |
|---|---|---|
| `PATCH` | `/api/videos/{id}/progress` | Mark video completed/incomplete |

### Notes (`/api/videos`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/videos/{id}/notes/generate` | Generate AI notes (calls FastAPI → Groq) |
| `GET` | `/api/videos/{id}/notes` | Get existing notes (no regeneration) |
| `PUT` | `/api/videos/{id}/notes` | Save manually edited notes |

### Playlist Chat (`/api/playlists`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/playlists/{id}/chat` | Send message, get RAG-grounded answer |
| `GET` | `/api/playlists/{id}/chat/history` | Fetch conversation history |

---

### FastAPI Endpoints (internal, protected by `X-Transcript-Secret` header)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/transcript/{video_id}` | Fetch YouTube transcript |
| `POST` | `/embed/video` | Chunk + embed one video, store in pgvector |
| `POST` | `/chat/playlist` | Full RAG: embed → search → Groq → save |
| `GET` | `/chat/playlist/{id}/history` | Fetch chat history from DB |
| `DELETE` | `/embed/playlist/{id}` | Delete all chunks for a playlist |

---

## AI Pipeline

### Notes Generation Flow

```
POST /api/videos/{id}/notes/generate
        │
        ▼
Spring: TranscriptService
  GET https://transcript.YOURDOMAIN.TLD/transcript/{youtubeVideoId}
  Header: X-Transcript-Secret: <secret>
        │
        ▼
FastAPI: youtube-transcript-api (residential IP — no YouTube block)
  Returns raw transcript text (~43,000 chars for typical lecture)
        │
        ▼
Spring: NoteService.callGroq()
  Truncates transcript to 12,000 chars (Groq token limit)
  Sends to Groq: llama-3.3-70b-versatile
  System prompt requests structured Markdown with:
    📘 Overview · 🧠 Core Concepts · 📖 Detailed Notes
    🧮 Formulae · 💡 Important Points · ⚠️ Common Mistakes
    🎯 Revision Notes · ❓ Practice Questions · ✅ Key Takeaways
        │
        ▼
Spring: NoteRepository.save()
  Stores raw Markdown in notes table
        │
        ▼
Frontend: AIDrawer.jsx
  marked.parse() converts Markdown → HTML
  dangerouslySetInnerHTML renders it
  ✏️ edit button → PUT /api/videos/{id}/notes
  🖨️ print button → opens clean print window with CSS
```

### Load-on-Open (no re-generation on refresh)

```
User opens AI Notes drawer
        │
        ▼
GET /api/videos/{id}/notes
  ├── 200 + content? → render existing note (no Groq call)
  └── 204 / error?   → call POST /generate (first time only)
```

---

## RAG System

### Embedding Pipeline (triggered on playlist add)

```
POST /api/playlists (user adds playlist)
        │
        ▼
Spring: PlaylistService.addPlaylist()
  Syncs all videos from YouTube Data API
        │
        ▼
Spring: PlaylistEmbeddingService.embedPlaylist()

  ┌─── Phase 1 (SYNCHRONOUS — in same request) ─────────────────┐
  │  For videos[0] and videos[1]:                               │
  │    GET /transcript/{youtubeVideoId}  (FastAPI tunnel)       │
  │    POST /embed/video                 (FastAPI tunnel)       │
  │      → LangChain RecursiveCharacterTextSplitter             │
  │        chunk_size=500, overlap=50                           │
  │      → Google text-embedding-004 (768 dimensions)           │
  │      → INSERT INTO transcript_chunks (pgvector direct)      │
  │  playlist.embeddingStatus = PARTIAL                         │
  │  Return response to user ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
  └─────────────────────────────────────────────────────────────┘
        │
        ▼ (async, @Async Spring thread pool)
  ┌─── Phase 2 (ASYNC BACKGROUND) ──────────────────────────────┐
  │  For videos[2..end]:                                        │
  │    GET /transcript/{youtubeVideoId}                         │
  │    POST /embed/video                                        │
  │    (each video committed independently)                     │
  │  On success: playlist.embeddingStatus = READY               │
  │  On failure: playlist.embeddingStatus = PARTIAL/FAILED      │
  └─────────────────────────────────────────────────────────────┘
```

### RAG Chat Flow

```
POST /api/playlists/{id}/chat  { "message": "What is a binary search tree?" }
        │
        ▼
Spring: PlaylistChatService → POST /chat/playlist (FastAPI)
        │
        ▼
FastAPI:
  1. embed_query(message) → Google text-embedding-004 (task_type=retrieval_query)
  2. pgvector cosine similarity search:
       SELECT content, video_id
       FROM transcript_chunks
       WHERE playlist_id = ?
       ORDER BY embedding <=> query_vector
       LIMIT 5
  3. Fetch last 6 messages (conversation history)
  4. Build prompt:
       System: "You are a tutor. Use ONLY these transcript excerpts..."
               [top-5 chunks with video IDs]
       History: [last 6 messages]
       User: "What is a binary search tree?"
  5. Groq: llama-3.3-70b-versatile → answer
  6. Save user message + assistant response to playlist_chat_messages
  7. Return { reply, sourceVideoIds }
```

---

## Cloudflare Tunnel Setup

### Why a Tunnel?

YouTube blocks transcript requests from known cloud/datacenter IP ranges (AWS, GCP, Railway, Vercel). There is no workaround within a cloud deployment — YouTube uses IP range blocklists, not per-IP rate limits. Running the transcript service on a **residential home IP** is the only reliable free solution.

A Cloudflare Named Tunnel exposes your locally-running FastAPI service to the internet via a stable HTTPS subdomain — no open ports, no router configuration, no dynamic DNS needed.

### How It Works

```
Internet request → Cloudflare Edge (del01/del05)
                        │
                        │ (outbound connection — no open inbound ports)
                        ▼
              cloudflared daemon (Windows service on your laptop)
                        │
                        ▼
              localhost:8000 (uvicorn FastAPI)
```

The key insight: `cloudflared` makes an **outbound** QUIC/HTTP2 connection to Cloudflare's edge. Your laptop never has an open inbound port — it's completely NAT-friendly and firewall-safe.

### Setup Commands

```bash
# 1. Login to Cloudflare
cloudflared tunnel login

# 2. Create named tunnel (one-time)
cloudflared tunnel create poplu

# 3. Create DNS route (one-time — adds CNAME in Cloudflare DNS)
cloudflared tunnel route dns poplu transcript.YOURDOMAIN.TLD

# 4. Config file at C:\Users\YOU\.cloudflared\config.yml:
tunnel: <tunnel-id-from-step-2>
credentials-file: C:\Users\YOU\.cloudflared\<tunnel-id>.json
ingress:
  - hostname: transcript.YOURDOMAIN.TLD
    service: http://localhost:8000
  - service: http_status:404

# 5. Install as Windows background service (survives reboots)
cloudflared service install

# 6. FastAPI as Windows background service via NSSM
nssm install TrackTubeTranscript
# Path: C:\...\transcript-server\venv\Scripts\python.exe
# Args: -m uvicorn main:app --host 0.0.0.0 --port 8000
# Environment: TRANSCRIPT_SERVICE_SECRET=x GOOGLE_GEMINI_API_KEY=x DATABASE_URL=x
```

### Security

The FastAPI service validates a shared secret on every request:

```
Spring → FastAPI: Header X-Transcript-Secret: <shared-secret>
FastAPI: validates secret matches TRANSCRIPT_SERVICE_SECRET env var
         returns 401 if missing or wrong
```

This ensures even if someone discovers the tunnel URL, they can't call your transcript service without the secret.

### Limitations

- Your laptop must be **powered on and connected to the internet** for AI Notes and RAG chat to work
- If your laptop is offline, `GET /api/videos/{id}/notes` still works for already-generated notes (served from DB), but generating new notes fails
- The domain (`transcript.YOURDOMAIN.TLD`) is permanent — it won't change across restarts unlike the old quick-tunnel approach

---

## Environment Variables

### Spring Boot (Railway → playlistTracker service)

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` (Railway) |
| `GOOGLE_YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `GROQ_API_KEY` | Groq API key for LLM calls |
| `TRANSCRIPT_SERVICE_URL` | `https://transcript.YOURDOMAIN.TLD` |
| `TRANSCRIPT_SERVICE_SECRET` | Shared secret (must match FastAPI) |
| `GOOGLE_GEMINI_API_KEY` | Google AI Studio key (for embedding) |

### FastAPI (local laptop — set before starting uvicorn)

| Variable | Description |
|---|---|
| `TRANSCRIPT_SERVICE_SECRET` | Shared secret (must match Spring) |
| `GOOGLE_GEMINI_API_KEY` | Google AI Studio key for text-embedding-004 |
| `DATABASE_URL` | `postgresql://user:pass@host:port/db` (Railway Postgres) |
| `GROQ_API_KEY` | Groq API key for chat completions |

### Frontend (Vercel)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | `https://playlisttracker-production.up.railway.app` |

---

## Local Development

### Spring Boot

```bash
# Requires: Java 21, Maven, PostgreSQL running locally
cd playlistTracker
mvn spring-boot:run
# Runs on http://localhost:8080
# Uses application.yml fallback values (local postgres, localhost:8000 for FastAPI)
```

### FastAPI (transcript service)

```bash
cd transcript-server
python3 -m venv venv
source venv/bin/activate          # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Set env vars
export TRANSCRIPT_SERVICE_SECRET=dev-local-secret
export GOOGLE_GEMINI_API_KEY=your-key
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/playlist_tracker
export GROQ_API_KEY=your-key

uvicorn main:app --host 0.0.0.0 --port 8000
# Runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
# .env.development sets VITE_API_BASE_URL to point to local Spring
```

---

## Deployment

### Spring Boot → Railway

- Auto-deploys on push to main branch
- `Dockerfile` at repo root
- All env vars set in Railway dashboard → playlistTracker service → Variables
- Uses Railway-managed PostgreSQL (same project, linked automatically)

### Frontend → Vercel

- Auto-deploys on push to main branch
- `VITE_API_BASE_URL` set in Vercel dashboard → Environment Variables
- Build command: `npm run build`, output dir: `dist`

### FastAPI → Laptop (Cloudflare Tunnel)

- Runs as a Windows background service via NSSM (auto-starts on boot)
- `cloudflared` runs as a Windows background service (auto-starts on boot)
- No Railway deployment — intentionally runs on residential IP to bypass YouTube IP blocking

---

## Key Engineering Decisions

### 1. Session-based Auth (not JWT)
Spring Session with a `JSESSIONID` cookie. Works well for a server-rendered-style SPA with a single backend. Simpler to implement and revoke than JWT for this scale.

### 2. Per-user Playlist Copies (not shared)
When a user adds a playlist, TrackTube creates a private copy of all videos for that user. Progress, notes, and embeddings are fully isolated per user. This prevents IDOR (Insecure Direct Object Reference) — every DB query includes `AND user_id = ?`.

### 3. Residential IP for Transcripts (not proxies)
YouTube blocks datacenter IPs at the IP range level, not per-IP. Residential proxy services like Webshare's free tier use datacenter IPs (despite the name) and don't work. Webshare's paid "Residential" tier (~$10/month) would work but adds cost. Running the service locally on a real home internet connection is the cleanest free solution.

### 4. Notes Stored as Raw Markdown
Groq returns Markdown. We store it as-is in the DB rather than pre-converting to HTML. This means the editor (edit mode) always gets clean, readable Markdown. The frontend converts to HTML at render time via `marked.parse()`.

### 5. Two-Phase Embedding (sync first 2, async rest)
Embedding an entire large playlist (47+ videos) synchronously would block the HTTP request for minutes. The first 2 videos provide immediate RAG capability so the chat feature is usable right away, while the background job processes the rest. The `embedding_status` field (NONE → PARTIAL → READY) lets the frontend show appropriate states.

### 6. FastAPI Owns pgvector Writes Directly
Rather than returning embeddings to Spring and having Spring save them (adding a large HTTP payload per chunk), FastAPI writes directly to the shared Railway PostgreSQL using psycopg2 + pgvector. Spring still owns the schema (Hibernate DDL), FastAPI just inserts/queries. This avoids unnecessary network round-trips for bulk embedding operations.

### 7. IVFFlat Index for Vector Search
`ivfflat` (Inverted File with Flat quantization) is the standard pgvector index for cosine similarity at moderate scale. Created once the chunk count exceeds 100 rows. Enables sub-millisecond similarity search across thousands of chunks per playlist.

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Axios, marked.js |
| Backend | Spring Boot 3.5, Spring Security, Spring Data JPA |
| AI Service | Python 3.11, FastAPI, uvicorn |
| LLM | Groq — llama-3.3-70b-versatile |
| Embeddings | Google text-embedding-004 (768 dims) |
| Transcript | youtube-transcript-api (Python) |
| Database | PostgreSQL 18 + pgvector extension |
| ORM | Hibernate 6 (Spring Boot) + psycopg2 (Python) |
| Tunnel | Cloudflare Named Tunnel (cloudflared) |
| Deployment | Vercel (frontend) + Railway (Spring + Postgres) + Laptop (FastAPI) |

---

## Author

Built by **Vidhan** · B.Tech Data Science & Engineering, MIT Manipal (2024–2028)

*TrackTube was built as a personal learning project to solve a real problem: losing track of YouTube playlist progress and having no structured way to study from lectures.*
