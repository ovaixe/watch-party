import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket/socketClient";

export function useSocket(): Socket {
  // The singleton socket is created (and its listeners wired) on first use.
  const [socket] = useState(getSocket);

  useEffect(() => {
    // Ensure we're connected. Safe to call repeatedly (e.g. StrictMode
    // re-mounts); a no-op when already connected, and never disconnects the
    // shared socket on cleanup so the connection survives re-mounts.
    if (!socket.connected) {
      socket.connect();
    }
  }, [socket]);

  return socket;
}
