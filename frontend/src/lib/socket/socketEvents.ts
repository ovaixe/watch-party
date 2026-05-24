import type { Socket } from "socket.io-client";
import type { ServerEvents, ClientEvents } from "../../types/events";
import { useSessionStore } from "../stores/sessionStore";

export function setupSocketListeners(
  socket: Socket<ServerEvents, ClientEvents>,
): void {
  const { syncToState, setConnectedUsers, setConnected } =
    useSessionStore.getState();

  // Connection events
  socket.on("connect", () => {
    console.log("Connected to server");
    setConnected(true);
    // Request session state on connect to ensure we get it
    socket.emit("join");
    // Also request sync in case we missed the initial sessionState
    socket.emit("syncRequest");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server");
    setConnected(false);
  });

  // Session state
  socket.on("sessionState", (state) => {
    console.log("Received session state:", state);
    syncToState(state);
  });

  // Playback events
  socket.on("play", () => {
    console.log("Server: play event received");
    useSessionStore.getState().setPlaying(true);
  });

  socket.on("pause", () => {
    console.log("Server: pause event received");
    useSessionStore.getState().setPlaying(false);
  });

  socket.on("seek", (data) => {
    console.log("Server: seek to", data.time);
    useSessionStore.getState().setCurrentTime(data.time);
  });

  socket.on("videoChanged", (data) => {
    console.log("Server: video changed", data);
    const store = useSessionStore.getState();
    store.setVideoUrl(data.url);
    store.setVideoId(data.videoId);
    store.setCurrentTime(0);
    store.setPlaying(false);
  });

  socket.on("userJoined", (data) => {
    console.log("Users:", data.count);
    setConnectedUsers(data.count);
  });

  socket.on("userLeft", (data) => {
    setConnectedUsers(data.count);
  });

  socket.on("driftCorrection", (data) => {
    const store = useSessionStore.getState();
    // Ignore drift when not playing (e.g. a stale correction arriving just
    // after a video change, which would otherwise yank back the timestamp).
    if (!store.isPlaying) return;
    const diff = Math.abs(store.currentTime - data.time);
    if (diff > 1) {
      console.log("Drift correction:", data.time, "diff:", diff);
      store.setCurrentTime(data.time);
    }
  });
}
