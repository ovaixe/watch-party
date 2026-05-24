"""Applies validated actions to the session and resolves YouTube video IDs."""

from __future__ import annotations

import re

from .session import Session
from .types import Action, now_ms

# Stale actions (older than this many ms) are dropped to avoid replaying
# out-of-date commands after a network hiccup.
STALE_ACTION_MS = 5000

_VIDEO_ID_PATTERNS = [
    re.compile(r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)"),
    re.compile(r"^([a-zA-Z0-9_-]{11})$"),
]


class SyncEngine:
    def __init__(self, session: Session) -> None:
        self.session = session

    def handle_action(self, action: Action) -> None:
        if now_ms() - action.timestamp > STALE_ACTION_MS:
            return

        if action.type == "play":
            self.session.play()
        elif action.type == "pause":
            self.session.pause()
        elif action.type == "seek":
            time_value = action.data.get("time")
            if time_value is not None:
                self.session.seek(time_value)
        elif action.type == "changeVideo":
            url = action.data.get("url")
            video_id = action.data.get("videoId")
            if url and video_id:
                self.session.set_video(url, video_id)

    @staticmethod
    def extract_video_id(url: str) -> str | None:
        for pattern in _VIDEO_ID_PATTERNS:
            match = pattern.search(url)
            if match and match.group(1):
                return match.group(1)
        return None
