# Watch Party - Synchronized YouTube Viewing

A real-time synchronized YouTube watch party where multiple users watch videos
together in perfect sync. Any play, pause, seek, or video change made by one
user is instantly applied for everyone else.

## Tech Stack

**Backend**
- Python 3.11+ with [FastAPI](https://fastapi.tiangolo.com/) (HTTP / health)
- [python-socketio](https://python-socketio.readthedocs.io/) (ASGI) for real-time events
- [Uvicorn](https://www.uvicorn.org/) ASGI server
- In-memory session state (single global room)
- Managed with [uv](https://docs.astral.sh/uv/)

**Frontend**
- [React 19](https://react.dev/) + [Vite](https://vite.dev/) + TypeScript
- [Zustand](https://zustand.docs.pmnd.rs/) for state management
- [socket.io-client](https://socket.io/docs/v4/client-api/) for real-time events
- [react-youtube](https://github.com/tjallingt/react-youtube) (YouTube IFrame API)
- [Tailwind CSS v4](https://tailwindcss.com/)

## Project Structure

```
watch-party/
├── backend/                      # FastAPI + Socket.IO server
│   ├── app/
│   │   ├── main.py               # FastAPI + Socket.IO ASGI app
│   │   ├── config.py             # Env-based configuration
│   │   ├── api/
│   │   │   └── health.py         # GET /health
│   │   ├── domain/               # Core business logic
│   │   │   ├── types.py          # Action / state types
│   │   │   ├── session.py        # Session entity (authoritative state)
│   │   │   └── sync_engine.py    # Action validation + video-id parsing
│   │   └── infrastructure/
│   │       ├── session_repository.py
│   │       └── socket_handlers.py   # Socket.IO event wiring + drift loop
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                     # React + Vite app
│   ├── src/
│   │   ├── App.tsx               # Main watch-party page
│   │   ├── components/           # VideoPlayer, Controls, UserList
│   │   ├── hooks/                # useSocket, useSessionSync
│   │   ├── lib/
│   │   │   ├── socket/           # socket client + event listeners
│   │   │   └── stores/           # Zustand session store
│   │   └── types/events.ts       # Shared event/state types
│   ├── vite.config.ts
│   ├── Dockerfile                # multi-stage build → nginx
│   ├── nginx.conf
│   └── .env.example
│
├── docker-compose.yml            # Runs both services
└── README.md
```

The backend and frontend are fully independent — each has its own dependencies
and is started on its own. Run them with Docker Compose, or locally in two
terminals.

## Run with Docker Compose

The quickest way to start the whole stack:

```bash
docker compose up --build
```

- Frontend → http://localhost:3000 (static build served by nginx)
- Backend → http://localhost:3001

`VITE_WS_URL` is baked into the frontend bundle at build time and `CORS_ORIGIN`
is set on the backend — both are configured in [docker-compose.yml](docker-compose.yml).
If you serve the app from a different host/port, update those values and rebuild.

## Run locally (without Docker)

### Prerequisites

- Python 3.11+ and [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js 18+ and npm

### Backend (terminal 1)

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 3001
```

### Frontend (terminal 2)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000 in two or more browser tabs to test synchronization.

## Environment Variables

**Backend** (`backend/.env`)
```env
PORT=3001
CORS_ORIGIN=http://localhost:3000   # comma-separate multiple origins
```

**Frontend** (`frontend/.env`)
```env
VITE_WS_URL=http://localhost:3001
```

## How It Works

### Synchronization strategy

1. **Action-based sync** — clients send discrete actions (play, pause, seek,
   changeVideo), not a continuous time stream.
2. **Server as source of truth** — the backend holds the authoritative session
   state in memory.
3. **Broadcast** — on each action the server updates state and broadcasts the
   command to every connected client (including the sender) for consistency.
4. **Stale-action guard** — actions older than 5 seconds are ignored.
5. **Drift correction** — every 5 seconds while playing, the server broadcasts
   the expected playback time; clients re-seek only if they have drifted > 1s.

### WebSocket event protocol

**Client → Server:** `join`, `play`, `pause`, `seek`, `changeVideo`, `syncRequest`

**Server → Client:** `sessionState`, `play`, `pause`, `seek`, `videoChanged`,
`userJoined`, `driftCorrection`

### New-user sync

On connect the server adds the socket to the session and immediately emits the
full `sessionState`; the client seeks the player to the current video, time, and
play/pause state.

## Manual Testing

1. Open the app in two browser tabs.
2. Load a YouTube URL in tab 1 → tab 2 loads the same video.
3. Play / pause / seek in tab 1 → tab 2 mirrors it.
4. Open a third tab mid-playback → it syncs to the current state.
5. Watch the connected-user count update as tabs open and close.

## Deployment

- **Frontend**: build with `npm run build` (outputs `frontend/dist/`) and serve
  the static files (e.g. Vercel, Netlify, any static host). Set `VITE_WS_URL`
  to the backend URL at build time.
- **Backend**: run `uvicorn app.main:app --host 0.0.0.0 --port $PORT` on a host
  that supports long-lived WebSocket connections (Railway, Render, Fly.io). Set
  `CORS_ORIGIN` to the deployed frontend origin.

## Known Limitations

1. **No persistence** — session state is in memory and lost on restart.
2. **Single server** — no horizontal scaling (would need a Redis adapter).
3. **No authentication** — anyone with the URL can join the single global room.
4. **YouTube embedding** — some videos are not embeddable.
