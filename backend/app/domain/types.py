"""Domain types shared across the synchronization layer.

The serialized session state uses camelCase keys because the React client
consumes them directly off the wire (see ``frontend/src/types/events.ts``).
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Literal, Optional, TypedDict

ActionType = Literal["play", "pause", "seek", "changeVideo"]


def now_ms() -> int:
    """Current time in milliseconds, matching the JS client's ``Date.now()``."""
    return int(time.time() * 1000)


class SessionStateDTO(TypedDict):
    """Wire format sent to clients via the ``sessionState`` event."""

    videoId: Optional[str]
    videoUrl: Optional[str]
    isPlaying: bool
    currentTime: float
    lastUpdated: int
    connectedUsers: int


@dataclass
class Action:
    type: ActionType
    timestamp: int
    data: dict[str, Any] = field(default_factory=dict)
