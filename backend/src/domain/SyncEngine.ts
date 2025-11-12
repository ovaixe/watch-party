import { Session } from "./Session";
import { Action } from "./types";

export class SyncEngine {
  private session: Session;
  private driftCheckInterval: NodeJS.Timeout | null = null;

  constructor(session: Session) {
    this.session = session;
  }

  stop(): void {
    if (this.driftCheckInterval) {
      clearInterval(this.driftCheckInterval);
      this.driftCheckInterval = null;
    }
  }

  handleAction(action: Action): void {
    const now = Date.now();

    // Ignore stale actions (older than 5 seconds)
    if (now - action.timestamp > 5000) {
      return;
    }

    switch (action.type) {
      case "play":
        this.session.play();
        break;
      case "pause":
        this.session.pause();
        break;
      case "seek":
        if (action.data?.time !== undefined) {
          this.session.seek(action.data.time);
        }
        break;
      case "changeVideo":
        if (action.data?.url && action.data?.videoId) {
          this.session.setVideo(action.data.url, action.data.videoId);
        }
        break;
    }
  }

  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}
