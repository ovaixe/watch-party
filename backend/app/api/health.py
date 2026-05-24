"""Health check endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from ..domain.types import now_ms

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    return {"status": "ok", "timestamp": now_ms()}
