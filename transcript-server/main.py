import logging

from fastapi import FastAPI, HTTPException
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


@app.get("/transcript/{video_id}")
def get_transcript(video_id: str):
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