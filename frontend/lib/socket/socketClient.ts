"use client";

import { io, Socket } from "socket.io-client";
import type { ServerEvents, ClientEvents } from "../../types/events";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

let socketInstance: Socket<ServerEvents, ClientEvents> | null = null;

export function createSocketClient(): Socket<ServerEvents, ClientEvents> {
  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socketInstance;
}
