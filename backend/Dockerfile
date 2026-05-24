# syntax=docker/dockerfile:1
FROM python:3.13-slim

# Bring in the uv binary (pinned).
COPY --from=ghcr.io/astral-sh/uv:0.11.7 /uv /bin/uv

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

# Install dependencies first for better layer caching.
COPY pyproject.toml ./
RUN uv sync --no-install-project

# Application code.
COPY app ./app

EXPOSE 3001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001"]
