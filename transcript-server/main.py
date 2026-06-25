from fastapi import FastAPI, HTTPException
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._ errors import *

app = FastAPI()
ytt_api = YouTubeTranscriptApi()

@app.get("/transcript/{video_id}")
def get_transcript(video_id : str):
    try:
        transcript = ytt_api.get_transcript(
            video_id,
            languages=[
                "en",
                "en-US",
                "hi"
            ]
        )

        # Only getting text for now (we will also use timestamps later)
        text = " ".join(
            entry["text"],
            for entry in transcript
        )

        return {
            "video_id": video_id,
            "transcript": text
        }

    except TranscriptsDisabled:
        raise HTTPException(
            status_code=404,
            detail="Captios not available"
        )

    except NoTranscriptFound:
        raise HTTPException(
            status_code=404,
            detail="No transcripts found"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/health")
def health():
    return {
        "status" : "OK"
    }