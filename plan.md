<!-- d149d189-7411-4039-80e0-317863b535e4 3a36ca08-6691-4dd4-bcd4-1146bb4e5b6d -->
# Watch Party Application - Clean Architecture Plan

## Architecture Overview

The application follows a **layered clean architecture** pattern with clear separation between:

- **Presentation Layer** (Frontend UI components)
- **Application Layer** (Business logic, state management)
- **Infrastructure Layer** (WebSocket communication, YouTube API)
- **Domain Layer** (Core entities and synchronization logic)

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   UI Layer   │  │  State Mgmt  │  │  WebSocket   │  │
│  │  Components  │  │   (Zustand)  │  │   Client     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                    WebSocket (Socket.io)
                          │
┌─────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   API Layer  │  │  Sync Engine │  │  Session     │  │
│  │  (Express)   │  │   (Domain)   │  │  Manager     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                          │                               │
│                    ┌──────────────┐                     │
│                    │  Socket.io   │                     │
│                    │    Server    │                     │
│                    └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Framework**: Next.js 14+ (App Router) - SSR/SSG capabilities, easy deployment
- **State Management**: Zustand - lightweight, simple API
- **WebSocket Client**: Socket.io-client
- **YouTube Integration**: YouTube IFrame Player API
- **Styling**: Tailwind CSS

### Backend

- **Runtime**: Node.js with Express
- **WebSocket**: Socket.io
- **Session Storage**: In-memory Map (can be upgraded to Redis for production)
- **Type Safety**: TypeScript

## Project Structure

```
watch-party/
├── frontend/                    # Next.js application
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main watch party page
│   │   └── api/                # API routes (if needed)
│   ├── components/             # React components
│   │   ├── VideoPlayer/        # YouTube player wrapper
│   │   │   ├── VideoPlayer.tsx
│   │   ├── Controls/           # Playback controls
│   │   │   ├── PlayPauseButton.tsx
│   │   │   ├── SeekButton.tsx
│   │   │   └── VideoUrlInput.tsx
│   │   └── UserList/           # Connected users display
│   ├── lib/                    # Utilities and services
│   │   ├── socket/             # WebSocket client
│   │   │   ├── socketClient.ts
│   │   │   └── socketEvents.ts
│   │   └── stores/             # Zustand stores
│   │       └── sessionStore.ts
│   ├── hooks/                  # Custom React hooks
│   │   ├── useSessionSync.ts   # Synchronization logic
│   │   └── useSocket.ts        # Socket connection hook
│   └── types/                  # TypeScript types
│       └── session.ts
│       └── events.ts
│
├── backend/                     # Node.js server
│   ├── src/
│   │   ├── server.ts           # Express + Socket.io setup
│   │   ├── domain/             # Core business logic
│   │   │   ├── Session.ts      # Session entity
│   │   │   ├── SyncEngine.ts   # Synchronization engine
│   │   │   └── types.ts        # Domain types
│   │   ├── infrastructure/     # External integrations
│   │   │   ├── socket/         # Socket.io handlers
│   │   │   │   ├── socketHandler.ts
│   │   │   │   └── eventHandlers.ts
│   │   │   └── session/        # Session storage
│   │   │       └── SessionRepository.ts
│   │   └── api/                # REST endpoints (if needed)
│   │       └── health.ts
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
└── package.json                 # Root package.json (monorepo setup)
```

## Core Components Design

### 1. Session State Management

**Domain Model** (`backend/src/domain/Session.ts`):

```typescript
interface SessionState {
  videoId: string | null;
  videoUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;  // Timestamp for drift detection
  connectedUsers: Set<string>;  // User IDs
}
```

**Key Design Decisions**:

- Single global session stored in memory
- Timestamp tracking for drift detection
- User set for connection tracking

### 2. Synchronization Engine

**Location**: `backend/src/domain/SyncEngine.ts`

**Responsibilities**:

- Validate incoming actions
- Apply actions to session state
- Broadcast state changes
- Handle drift correction
- Manage action ordering (using timestamps)

**Synchronization Strategy**:

1. **Action-Based Sync**: Users send actions (play, pause, seek), not continuous time updates
2. **Timestamp Ordering**: Actions include client timestamp for ordering
3. **Drift Detection**: Server periodically checks for time drift and corrects
4. **New User Sync**: On connect, send full current state

**Event Flow**:

```
User Action → Client → WebSocket → Server SyncEngine → 
Update Session → Broadcast to All → Clients Update Player
```

### 3. WebSocket Event Protocol

**Client → Server Events**:

- `join` - User joins session
- `play` - Play action
- `pause` - Pause action
- `seek` - Seek to time
- `changeVideo` - Change video URL
- `syncRequest` - Request current state

**Server → Client Events**:

- `sessionState` - Full session state (on join/sync)
- `play` - Play command
- `pause` - Pause command
- `seek` - Seek command
- `videoChanged` - Video URL changed
- `userJoined` - User count update
- `driftCorrection` - Time correction

### 4. Frontend State Management

**Zustand Store** (`frontend/lib/stores/sessionStore.ts`):

```typescript
interface SessionStore {
  videoUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  connectedUsers: number;
  // Actions
  setVideoUrl: (url: string) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  syncToState: (state: SessionState) => void;
}
```

### 5. YouTube Player Integration

**Component**: `frontend/components/VideoPlayer/VideoPlayer.tsx`

**Implementation**:

- Use YouTube IFrame Player API with react-youtube library
- Listen to player events (onStateChange, onTimeUpdate)
- Apply server commands (play, pause, seek)
- Throttle local time updates to avoid spam

**Key Considerations**:

- YouTube API requires iframe embedding
- Player state changes trigger events that need filtering
- Seek operations need debouncing to prevent loops

## Synchronization Challenges & Solutions

### Challenge 1: Network Delays

**Solution**:

- Server is source of truth
- Actions include client timestamp, but server applies with server timestamp
- Use action-based sync (not continuous time streaming)

### Challenge 2: Action Ordering

**Solution**:

- Each action includes `timestamp` and `sequenceNumber`
- Server processes actions in order
- Ignore stale actions (older than current state)

### Challenge 3: Video Drift

**Solution**:

- Periodic drift checks (every 5-10 seconds)
- Server calculates expected time based on last play action
- Broadcast correction if drift > 1 second

### Challenge 4: New User Sync

**Solution**:

- On `join` event, server sends full `sessionState`
- Client immediately syncs player to received state
- Player seeks to correct time and applies play/pause state

## Implementation Phases

### Phase 1: Core Infrastructure

1. Set up Next.js project with TypeScript
2. Set up Node.js backend with Express + Socket.io
3. Create basic WebSocket connection
4. Implement session state management (in-memory)

### Phase 2: Video Player Integration

1. Integrate YouTube IFrame Player API
2. Create video player component
3. Implement basic controls (play, pause, seek)
4. Extract video ID from URL

### Phase 3: Synchronization Logic

1. Implement SyncEngine on backend
2. Create WebSocket event handlers
3. Implement action broadcasting
4. Add new user sync logic

### Phase 4: Frontend Integration

1. Create Zustand store for session state
2. Connect WebSocket client to store
3. Sync player with store state
4. Handle user actions and emit events

### Phase 5: Polish & Testing

1. Add drift detection and correction
2. Add user count display
3. Improve UI/UX
4. Test with multiple clients
5. Add error handling

## Key Technical Decisions

### 1. Why Next.js over React?

- Better deployment options (Vercel)
- Built-in API routes if needed
- SSR capabilities for better initial load

### 2. Why Socket.io over raw WebSockets?

- Automatic reconnection handling
- Room/namespace support (useful for future multi-room)
- Better error handling
- Easier debugging

### 3. Why In-Memory Session Storage?

- Simple for MVP (single global session)
- No database setup required
- Fast and sufficient for assignment scope
- Can upgrade to Redis for production

### 4. Why Action-Based Sync?

- More efficient than continuous time updates
- Easier to handle ordering
- Reduces network traffic
- Natural for user-initiated actions

### 5. Why Zustand over Redux?

- Lighter weight
- Simpler API
- Less boilerplate
- Sufficient for this use case

## Deployment Strategy

### Frontend

- Deploy to Vercel (optimal for Next.js)
- Environment variable for WebSocket server URL

### Backend

- Deploy to Railway, Render, or Fly.io
- Expose WebSocket endpoint
- CORS configuration for frontend domain

### Environment Variables

```
# Frontend
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app

# Backend
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
```

## Testing Strategy

### Manual Testing Checklist

1. Open app in two browser tabs
2. Load video in tab 1 → verify tab 2 updates
3. Play in tab 1 → verify tab 2 plays
4. Pause in tab 1 → verify tab 2 pauses
5. Seek in tab 1 → verify tab 2 seeks
6. Change video in tab 1 → verify tab 2 changes
7. Open new tab → verify it syncs to current state
8. Test with network throttling (simulate delays)

### Known Limitations

1. **No persistence**: Session lost on server restart
2. **Single server**: No horizontal scaling (would need Redis)
3. **No authentication**: Anyone can join
4. **YouTube limitations**: Some videos may not be embeddable
5. **Mobile responsiveness**: Basic, not fully optimized

## Future Improvements (Given More Time)

1. Redis for session persistence and multi-server support
2. User authentication and names
3. Chat functionality
4. Multiple rooms support
5. Video queue/playlist
6. Better error handling and reconnection UI
7. Analytics and monitoring
8. Unit and integration tests
