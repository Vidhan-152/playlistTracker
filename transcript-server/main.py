import logging
import os

from fastapi import FastAPI, HTTPException, Header
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

TRANSCRIPT_SERVICE_SECRET = os.environ.get("TRANSCRIPT_SERVICE_SECRET")

if not TRANSCRIPT_SERVICE_SECRET:
    logger.warning(
        "TRANSCRIPT_SERVICE_SECRET is not set — this endpoint will reject all "
        "requests until it's configured (fails closed for safety)."
    )


def verify_secret(x_transcript_secret: str | None):
    # Fails closed: if the secret isn't configured at all, nothing gets through.
    if not TRANSCRIPT_SERVICE_SECRET or x_transcript_secret != TRANSCRIPT_SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/transcript/{video_id}")
def get_transcript(video_id: str, x_transcript_secret: str | None = Header(default=None)):
    verify_secret(x_transcript_secret)

    try:
        api = YouTubeTranscriptApi()

        transcript = api.fetch(
            video_id,
            languages=["en", "en-US", "en-GB", "hi"],
        )

        text = " ".join(snippet.text for snippet in transcript)

        return {
            "videoId": video_id,
            "transcript": text,
        }

    except TranscriptsDisabled:
        raise HTTPException(
            status_code=404,
            detail="Captions are disabled for this video",
        )

    except NoTranscriptFound:
        raise HTTPException(
            status_code=404,
            detail="No transcript found for this video",
        )

    except Exception as e:
        logger.exception("Failed to fetch transcript for video_id=%s", video_id)
        raise HTTPException(
            status_code=500,
            detail=f"this video has policy issues: {type(e).__name__}: {e}",
        )


@app.get("/health")
def health():
    return {
        "status": "ok",
    }