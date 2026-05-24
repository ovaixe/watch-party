"""Runtime configuration sourced from environment variables."""

from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

# Comma-separated list of allowed frontend origins for CORS.
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:3000")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGIN.split(",") if origin.strip()]

PORT = int(os.getenv("PORT", "3001"))
