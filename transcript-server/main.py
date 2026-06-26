from fastapi import FastAPI, HTTPException
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
)

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
        message = str(e)

        raise HTTPException(
            status_code=500,
            detail="this video has policy issues",
        )


@app.get("/health")
def health():
    return {
        "status": "ok",
    }