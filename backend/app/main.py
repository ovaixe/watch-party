"""Application entrypoint: FastAPI for HTTP + python-socketio for real-time.

``socketio.ASGIApp`` wraps the FastAPI app: Socket.IO traffic (``/socket.io/``)
is handled by the Socket.IO server, everything else falls through to FastAPI.
Run with::

    uvicorn app.main:app --reload --port 3001
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.health import router as health_router
from .config import CORS_ORIGINS
from .infrastructure.session_repository import SessionRepository
from .infrastructure.socket_handlers import drift_correction_loop, register_handlers
from .domain.sync_engine import SyncEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("watch_party")

# Domain wiring: one global session, driven by the sync engine.
session_repository = SessionRepository()
session = session_repository.get_session()
sync_engine = SyncEngine(session)

# Socket.IO server (ASGI mode). socket.io-client defaults to websocket+polling.
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=CORS_ORIGINS)
register_handlers(sio, session, sync_engine)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    drift_task = sio.start_background_task(drift_correction_loop, sio, session)
    logger.info("Watch Party server ready. CORS origins: %s", CORS_ORIGINS)
    yield
    # Background tasks are torn down with the event loop on shutdown.


fastapi_app = FastAPI(title="Watch Party", lifespan=lifespan)
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
fastapi_app.include_router(health_router)

# The combined ASGI application served by uvicorn.
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
