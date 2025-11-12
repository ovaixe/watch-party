// Re-export SessionState type
export interface SessionState {
  videoId: string | null;
  videoUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  connectedUsers: number;
}

