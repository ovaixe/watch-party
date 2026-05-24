"""Holds the process-wide single session instance."""

from __future__ import annotations

from ..domain.session import Session


class SessionRepository:
    def __init__(self) -> None:
        self._session = Session()

    def get_session(self) -> Session:
        return self._session
