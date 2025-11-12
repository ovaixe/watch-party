# Watch Party - Synchronized YouTube Viewing

A real-time synchronized YouTube watch party application where multiple users can watch videos together in perfect sync.

## Overview

This application allows multiple users to watch YouTube videos together in real-time. When any user performs an action (play, pause, seek, or change video), all connected users see the same action simultaneously. The application uses WebSockets for real-time communication and follows clean architecture principles.

## Architecture

### System Design

The application follows a **layered clean architecture** pattern:

- **Presentation Layer**: Next.js frontend with React components
- **Application Layer**: Zustand state management and business logic
- **Infrastructure Layer**: WebSocket communication (Socket.io) and YouTube API integration
- **Domain Layer**: Core synchronization logic and session management

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 19
- TypeScript
- Zustand (state management)
- Socket.io-client
- YouTube IFrame Player API
- Tailwind CSS

**Backend:**
- Node.js
- Express
- Socket.io
- TypeScript

### Project Structure

```
watch-party/
├── frontend/                 # Next.js application
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   │   ├── VideoPlayer/    # YouTube player wrapper
│   │   ├── Controls/       # Playback controls
│   │   └── UserList/       # Connected users display
│   ├── lib/                # Utilities and services
│   │   ├── socket/         # WebSocket client
│   │   └── stores/         # Zustand stores
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript types
│
├── backend/                 # Node.js server
│   └── src/
│       ├── domain/         # Core business logic
│       │   ├── Session.ts  # Session entity
│       │   └── SyncEngine.ts # Synchronization engine
│       ├── infrastructure/ # External integrations
│       │   ├── socket/     # Socket.io handlers
│       │   └── session/    # Session storage
│       └── server.ts       # Express + Socket.io setup
│
└── shared/                  # Shared types
    └── types/
        └── events.ts       # WebSocket event types
```

## Key Features

1. **Shared Session**: Single global session - all users automatically join the same session
2. **Real-time Synchronization**: All playback actions (play, pause, seek, change video) sync across all users
3. **New User Sync**: New users automatically sync to the current playback state when joining
4. **Drift Detection**: Periodic checks and corrections to prevent video playback drift
5. **User Count**: Display of connected users

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd watch-party
   ```

2. **Install root dependencies**:
   ```bash
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   cd ..
   ```

### Running Locally

#### Option 1: Run Both Services Together (Recommended)

From the root directory:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend application on `http://localhost:3000`

#### Option 2: Run Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Environment Variables

**Frontend** (`.env.local` in `frontend/` directory):
```env
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

**Backend** (`.env` in `backend/` directory):
```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

## How It Works

### Synchronization Strategy

1. **Action-Based Sync**: Users send actions (play, pause, seek, changeVideo) to the server, not continuous time updates
2. **Server as Source of Truth**: The server maintains the authoritative session state
3. **Broadcast Pattern**: When a user performs an action, the server updates its state and broadcasts to all other clients
4. **Timestamp Ordering**: Actions include timestamps to handle ordering and ignore stale actions
5. **Drift Correction**: Server periodically calculates expected playback time and broadcasts corrections if drift exceeds 1 second

### WebSocket Event Protocol

**Client → Server:**
- `join` - User joins session
- `play` - Play action
- `pause` - Pause action
- `seek` - Seek to specific time
- `changeVideo` - Change video URL
- `syncRequest` - Request current state

**Server → Client:**
- `sessionState` - Full session state (sent on join)
- `play` - Play command
- `pause` - Pause command
- `seek` - Seek command
- `videoChanged` - Video URL changed
- `userJoined` / `userLeft` - User count updates
- `driftCorrection` - Time correction

### New User Synchronization

When a new user connects:
1. Server adds user to session
2. Server immediately sends full `sessionState` to the new user
3. Client syncs YouTube player to received state (video, time, play/pause)
4. User is now in sync with all other users

## Testing

### Manual Testing Checklist

1. **Basic Functionality:**
   - Open the app in two browser tabs or devices
   - Load a YouTube video in tab 1 → verify tab 2 updates
   - Play in tab 1 → verify tab 2 plays
   - Pause in tab 1 → verify tab 2 pauses
   - Seek forward/backward in tab 1 → verify tab 2 seeks
   - Change video in tab 1 → verify tab 2 changes

2. **New User Sync:**
   - Open app in tab 1, load video and start playing
   - Open app in new tab 2 → verify it syncs to current playback state
   - Verify tab 2 shows correct video, time, and play/pause state

3. **Multiple Users:**
   - Open app in 3+ tabs/devices
   - Verify user count updates correctly
   - Perform actions in one tab → verify all others update

4. **Network Conditions:**
   - Test with browser DevTools network throttling
   - Verify synchronization still works with delays

### Testing Steps

1. Start the backend server:
   ```bash
   cd backend && npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```

3. Open `http://localhost:3000` in multiple browser tabs

4. Test each scenario from the checklist above

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_WS_URL` to your backend URL
4. Deploy

### Backend (Railway/Render/Fly.io)

1. Push code to GitHub
2. Create new project on your platform
3. Set environment variables:
   - `PORT` (usually auto-set)
   - `CORS_ORIGIN` to your frontend URL
4. Deploy

### Environment Variables for Production

**Frontend:**
```env
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
```

**Backend:**
```env
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
```

## Key Technical Decisions

### Why Next.js over React?
- Better deployment options (Vercel)
- Built-in API routes if needed
- SSR capabilities for better initial load

### Why Socket.io over raw WebSockets?
- Automatic reconnection handling
- Better error handling
- Easier debugging
- Room/namespace support for future multi-room

### Why In-Memory Session Storage?
- Simple for MVP (single global session)
- No database setup required
- Fast and sufficient for assignment scope
- Can upgrade to Redis for production

### Why Action-Based Sync?
- More efficient than continuous time updates
- Easier to handle ordering
- Reduces network traffic
- Natural for user-initiated actions

### Why Zustand over Redux?
- Lighter weight
- Simpler API
- Less boilerplate
- Sufficient for this use case

## Known Limitations

1. **No Persistence**: Session lost on server restart
2. **Single Server**: No horizontal scaling (would need Redis)
3. **No Authentication**: Anyone can join
4. **YouTube Limitations**: Some videos may not be embeddable
5. **Mobile Responsiveness**: Basic, not fully optimized

## Future Improvements

Given more time, I would:

1. **Redis Integration**: For session persistence and multi-server support
2. **User Authentication**: Add user names and authentication
3. **Chat Functionality**: Real-time chat during playback
4. **Multiple Rooms**: Support for multiple watch parties
5. **Video Queue/Playlist**: Queue multiple videos
6. **Better Error Handling**: More robust error messages and recovery
7. **Analytics**: Track usage and performance
8. **Unit Tests**: Comprehensive test coverage
9. **Mobile Optimization**: Better responsive design
10. **Video Quality Controls**: Allow users to change video quality

## Troubleshooting

### Frontend won't connect to backend
- Check that backend is running on port 3001
- Verify `NEXT_PUBLIC_WS_URL` environment variable
- Check browser console for errors
- Verify CORS settings in backend

### Video won't load
- Check that YouTube URL is valid
- Some videos may not be embeddable (copyright restrictions)
- Check browser console for YouTube API errors

### Synchronization issues
- Check network connection
- Verify WebSocket connection is established (check user count)
- Try refreshing the page
- Check server logs for errors
