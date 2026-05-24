"""The single global watch-party session (in-memory)."""

from __future__ import annotations

from .types import SessionStateDTO, now_ms


class Session:
    """Authoritative playback state shared by all connected users.

    ``last_updated`` is tracked in milliseconds so that drift calculations stay
    consistent with the client's ``Date.now()`` timestamps.
    """

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.video_id: str | None = None
        self.video_url: str | None = None
        self.is_playing: bool = False
        self.current_time: float = 0.0
        self.last_updated: int = now_ms()
        self.connected_users: set[str] = set()

    def get_state(self) -> SessionStateDTO:
        return {
            "videoId": self.video_id,
            "videoUrl": self.video_url,
            "isPlaying": self.is_playing,
            "currentTime": self.current_time,
            "lastUpdated": self.last_updated,
            "connectedUsers": len(self.connected_users),
        }

    def add_user(self, user_id: str) -> None:
        self.connected_users.add(user_id)

    def remove_user(self, user_id: str) -> None:
        self.connected_users.discard(user_id)

    @property
    def user_count(self) -> int:
        return len(self.connected_users)

    def set_video(self, video_url: str, video_id: str) -> None:
        self.video_url = video_url
        self.video_id = video_id
        self.current_time = 0.0
        self.is_playing = False
        self.last_updated = now_ms()

    def play(self) -> None:
        self.is_playing = True
        self.last_updated = now_ms()

    def pause(self) -> None:
        self.is_playing = False
        self.last_updated = now_ms()

    def seek(self, time_seconds: float) -> None:
        self.current_time = time_seconds
        self.last_updated = now_ms()

    def update_current_time(self, time_seconds: float) -> None:
        if self.is_playing:
            self.current_time = time_seconds
            self.last_updated = now_ms()

    def get_expected_time(self) -> float:
        """Where playback *should* be right now, accounting for elapsed time."""
        if not self.is_playing:
            return self.current_time
        elapsed = (now_ms() - self.last_updated) / 1000
        return self.current_time + elapsed
