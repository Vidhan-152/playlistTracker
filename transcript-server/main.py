import logging
import os

from fastapi import FastAPI, HTTPException
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

WEBSHARE_PROXY_USERNAME = os.environ.get("WEBSHARE_PROXY_USERNAME")
WEBSHARE_PROXY_PASSWORD = os.environ.get("WEBSHARE_PROXY_PASSWORD")

if not WEBSHARE_PROXY_USERNAME or not WEBSHARE_PROXY_PASSWORD:
    logger.warning(
        "WEBSHARE_PROXY_USERNAME/PASSWORD not set — requests will go out on this "
        "service's own IP and will likely be blocked by YouTube."
    )


def build_api() -> YouTubeTranscriptApi:
    if WEBSHARE_PROXY_USERNAME and WEBSHARE_PROXY_PASSWORD:
        return YouTubeTranscriptApi(
            proxy_config=WebshareProxyConfig(
                proxy_username=WEBSHARE_PROXY_USERNAME,
                proxy_password=WEBSHARE_PROXY_PASSWORD,
            )
        )
    return YouTubeTranscriptApi()


@app.get("/transcript/{video_id}")
def get_transcript(video_id: str):
    try:
        api = build_api()

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