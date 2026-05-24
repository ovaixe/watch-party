import { io, type Socket } from "socket.io-client";
import type { ServerEvents, ClientEvents } from "../../types/events";
import { setupSocketListeners } from "./socketEvents";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

let socketInstance: Socket<ServerEvents, ClientEvents> | null = null;

// Returns the app-wide singleton socket, creating it (and wiring its listeners)
// exactly once. Listeners are attached at creation time — before the async
// `connect` fires — so every consumer shares one connection and one listener set.
export function getSocket(): Socket<ServerEvents, ClientEvents> {
  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    setupSocketListeners(socketInstance);
  }
  return socketInstance;
}
