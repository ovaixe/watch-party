"""Socket.IO event wiring.

Mirrors the original Node/Socket.io protocol exactly so the existing client
contract is preserved:

    Client -> Server:  join, play, pause, seek, changeVideo, syncRequest
    Server -> Client:  sessionState, play, pause, seek, videoChanged,
                       userJoined, driftCorrection
"""

from __future__ import annotations

import asyncio
import logging

import socketio

from ..domain.session import Session
from ..domain.sync_engine import SyncEngine
from ..domain.types import Action, now_ms

logger = logging.getLogger("watch_party.socket")

# How often the server broadcasts an authoritative time so clients can correct
# playback drift (matches the original 5s interval).
DRIFT_INTERVAL_SECONDS = 5


def register_handlers(
    sio: socketio.AsyncServer,
    session: Session,
    sync_engine: SyncEngine,
) -> None:
    async def broadcast_user_count() -> None:
        await sio.emit("userJoined", {"count": session.user_count})

    def live_state() -> dict:
        # Snapshot of the session with the *expected* current time, so a client
        # syncing now lands at the live playback position rather than the last
        # stored value.
        state = dict(session.get_state())
        state["currentTime"] = session.get_expected_time()
        return state

    @sio.event
    async def connect(sid: str, environ: dict, auth: dict | None = None) -> None:
        logger.info("User connected: %s", sid)
        session.add_user(sid)
        # Hand the freshly connected client the live state immediately.
        await sio.emit("sessionState", live_state(), to=sid)
        await broadcast_user_count()

    @sio.event
    async def disconnect(sid: str) -> None:
        logger.info("User disconnected: %s", sid)
        session.remove_user(sid)
        await broadcast_user_count()
        if session.user_count == 0:
            session.reset()

    # The client emits `join` and `syncRequest` on connect; both just (re)deliver
    # the authoritative state to the requesting socket.
    @sio.on("join")
    async def on_join(sid: str, *_args) -> None:
        await sio.emit("sessionState", live_state(), to=sid)

    @sio.on("syncRequest")
    async def on_sync_request(sid: str, *_args) -> None:
        await sio.emit("sessionState", live_state(), to=sid)

    @sio.on("play")
    async def on_play(sid: str, data: dict) -> None:
        sync_engine.handle_action(Action(type="play", timestamp=data["timestamp"]))
        # Broadcast to everyone (including sender) for a consistent state.
        await sio.emit("play", {"timestamp": now_ms()})

    @sio.on("pause")
    async def on_pause(sid: str, data: dict) -> None:
        sync_engine.handle_action(Action(type="pause", timestamp=data["timestamp"]))
        await sio.emit("pause", {"timestamp": now_ms()})

    @sio.on("seek")
    async def on_seek(sid: str, data: dict) -> None:
        sync_engine.handle_action(
            Action(type="seek", timestamp=data["timestamp"], data={"time": data["time"]})
        )
        await sio.emit("seek", {"time": data["time"], "timestamp": now_ms()})

    @sio.on("changeVideo")
    async def on_change_video(sid: str, data: dict) -> None:
        video_id = sync_engine.extract_video_id(data["url"])
        if not video_id:
            return
        sync_engine.handle_action(
            Action(
                type="changeVideo",
                timestamp=data["timestamp"],
                data={"url": data["url"], "videoId": video_id},
            )
        )
        await sio.emit("videoChanged", {"url": data["url"], "videoId": video_id})


async def drift_correction_loop(sio: socketio.AsyncServer, session: Session) -> None:
    """Periodically broadcast the expected playback time while playing."""
    while True:
        await asyncio.sleep(DRIFT_INTERVAL_SECONDS)
        if session.is_playing:
            await sio.emit(
                "driftCorrection",
                {"time": session.get_expected_time(), "timestamp": now_ms()},
            )
