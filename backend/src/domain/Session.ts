import { Session as ISession } from "./types";

export class Session {
  private state: ISession;

  constructor() {
    this.state = {
      videoId: null,
      videoUrl: null,
      isPlaying: false,
      currentTime: 0,
      lastUpdated: Date.now(),
      connectedUsers: new Set<string>(),
    };
  }

  reset(): void {
    this.state = {
      videoId: null,
      videoUrl: null,
      isPlaying: false,
      currentTime: 0,
      lastUpdated: Date.now(),
      connectedUsers: new Set<string>(),
    };
  }

  getState(): Omit<ISession, "connectedUsers"> & { connectedUsers: number } {
    return {
      videoId: this.state.videoId,
      videoUrl: this.state.videoUrl,
      isPlaying: this.state.isPlaying,
      currentTime: this.state.currentTime,
      lastUpdated: this.state.lastUpdated,
      connectedUsers: this.state.connectedUsers.size,
    };
  }

  addUser(userId: string): void {
    this.state.connectedUsers.add(userId);
  }

  removeUser(userId: string): void {
    this.state.connectedUsers.delete(userId);
  }

  setVideo(videoUrl: string, videoId: string): void {
    this.state.videoUrl = videoUrl;
    this.state.videoId = videoId;
    this.state.currentTime = 0;
    this.state.isPlaying = false;
    this.state.lastUpdated = Date.now();
  }

  play(): void {
    this.state.isPlaying = true;
    this.state.lastUpdated = Date.now();
  }

  pause(): void {
    this.state.isPlaying = false;
    this.state.lastUpdated = Date.now();
  }

  seek(time: number): void {
    this.state.currentTime = time;
    this.state.lastUpdated = Date.now();
  }

  updateCurrentTime(time: number): void {
    if (this.state.isPlaying) {
      this.state.currentTime = time;
      this.state.lastUpdated = Date.now();
    }
  }

  getExpectedTime(): number {
    if (!this.state.isPlaying) {
      return this.state.currentTime;
    }
    const elapsed = (Date.now() - this.state.lastUpdated) / 1000;
    return this.state.currentTime + elapsed;
  }
}
