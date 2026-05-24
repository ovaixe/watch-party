import type { Socket } from "socket.io-client";
import { useSessionStore } from "../lib/stores/sessionStore";

// Emit-only handlers. We deliberately do NOT optimistically mutate the store
// here — the server is the source of truth and echoes every action back, and
// the player's sync effects compare against the store to decide whether an
// event is user-initiated (worth broadcasting) or just a remote echo.
export function useSessionSync(socket: Socket | null) {
  const { videoId } = useSessionStore();

  const handlePlay = () => {
    if (socket && videoId) {
      socket.emit("play", { timestamp: Date.now() });
    }
  };

  const handlePause = () => {
    if (socket && videoId) {
      socket.emit("pause", { timestamp: Date.now() });
    }
  };

  const handleSeek = (time: number) => {
    if (socket && videoId) {
      socket.emit("seek", { time, timestamp: Date.now() });
    }
  };

  return { handlePlay, handlePause, handleSeek };
}
