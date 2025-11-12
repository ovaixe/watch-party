import { Server, Socket } from "socket.io";
import { Session } from "../../domain/Session";
import { SyncEngine } from "../../domain/SyncEngine";
import { Action } from "../../domain/types";

export class SocketEventHandlers {
  private io: Server;
  private session: Session;
  private syncEngine: SyncEngine;

  constructor(io: Server, session: Session, syncEngine: SyncEngine) {
    this.io = io;
    this.session = session;
    this.syncEngine = syncEngine;
  }

  handleConnection(socket: Socket): void {
    const userId = socket.id;
    console.log(`User connected: ${userId}`);

    // Add user to session
    this.session.addUser(userId);

    // Send current session state to new user
    // const expectedTime = this.session.getExpectedTime();
    // this.session.updateCurrentTime(expectedTime);
    socket.emit("sessionState", this.session.getState());

    // Broadcast user count update
    this.broadcastUserCount();

    // Handle play action
    socket.on("play", (data: { timestamp: number }) => {
      const action: Action = {
        type: "play",
        timestamp: data.timestamp,
      };
      this.syncEngine.handleAction(action);
      // Broadcast to all clients (including sender for consistency)
      this.io.emit("play", { timestamp: Date.now() });
    });

    // Handle pause action
    socket.on("pause", (data: { timestamp: number }) => {
      const action: Action = {
        type: "pause",
        timestamp: data.timestamp,
      };
      this.syncEngine.handleAction(action);
      // Broadcast to all clients (including sender for consistency)
      this.io.emit("pause", { timestamp: Date.now() });
    });

    // Handle seek action
    socket.on("seek", (data: { time: number; timestamp: number }) => {
      const action: Action = {
        type: "seek",
        timestamp: data.timestamp,
        data: { time: data.time },
      };
      this.syncEngine.handleAction(action);
      // Broadcast to all clients (including sender for consistency)
      this.io.emit("seek", { time: data.time, timestamp: Date.now() });
    });

    // Handle video change
    socket.on("changeVideo", (data: { url: string; timestamp: number }) => {
      const videoId = this.syncEngine.extractVideoId(data.url);
      if (videoId) {
        const action: Action = {
          type: "changeVideo",
          timestamp: data.timestamp,
          data: { url: data.url, videoId },
        };
        this.syncEngine.handleAction(action);
        // Broadcast to all clients including sender
        this.io.emit("videoChanged", { url: data.url, videoId });
      }
    });

    // Handle sync request
    socket.on("syncRequest", () => {
      socket.emit("sessionState", this.session.getState());
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      this.session.removeUser(userId);
      this.broadcastUserCount();

      if (this.session.getState().connectedUsers === 0) {
        this.session.reset();
      }
    });
  }

  private broadcastUserCount(): void {
    const count = this.session.getState().connectedUsers;
    this.io.emit("userJoined", { count });
  }

  startPeriodicSync(): void {
    // Periodically broadcast current state to keep clients in sync
    setInterval(() => {
      if (this.session.getState().isPlaying) {
        const expectedTime = this.session.getExpectedTime();
        // Broadcast drift correction
        this.io.emit("driftCorrection", {
          time: expectedTime,
          timestamp: Date.now(),
        });
      }
    }, 5000); // Every 10 seconds
  }
}
