// Shared WebSocket event types

export interface SessionState {
  videoId: string | null;
  videoUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  connectedUsers: number;
}

// Client -> Server Events
export interface ClientEvents {
  join: () => void;
  play: (data: { timestamp: number }) => void;
  pause: (data: { timestamp: number }) => void;
  seek: (data: { time: number; timestamp: number }) => void;
  changeVideo: (data: { url: string; timestamp: number }) => void;
  syncRequest: () => void;
}

// Server -> Client Events
export interface ServerEvents {
  sessionState: (state: SessionState) => void;
  play: (data: { timestamp: number }) => void;
  pause: (data: { timestamp: number }) => void;
  seek: (data: { time: number; timestamp: number }) => void;
  videoChanged: (data: { url: string; videoId: string }) => void;
  userJoined: (data: { count: number }) => void;
  userLeft: (data: { count: number }) => void;
  driftCorrection: (data: { time: number; timestamp: number }) => void;
}

