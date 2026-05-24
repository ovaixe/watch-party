import { Clapperboard, Loader2 } from "lucide-react";
import { useSocket } from "./hooks/useSocket";
import { useSessionStore } from "./lib/stores/sessionStore";
import { useSessionSync } from "./hooks/useSessionSync";
import VideoPlayer from "./components/VideoPlayer/VideoPlayer";
import { VideoUrlInput } from "./components/Controls/VideoUrlInput";
import { UserList } from "./components/UserList/UserList";

export default function App() {
  const socket = useSocket();
  const { videoId, isPlaying, currentTime, isConnected } = useSessionStore();
  const { handlePlay, handlePause, handleSeek } = useSessionSync(socket);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient cinematic glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-[120px] animate-float-slow" />
        <div className="absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/20 blur-[120px] animate-float-slow [animation-delay:-4s]" />
        <div className="absolute -bottom-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-rose-500/15 blur-[120px] animate-float-slow [animation-delay:-8s]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-fuchsia-500/30">
              <Clapperboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
                Watch Party
              </h1>
              <p className="text-sm text-white/50">
                Watch YouTube together, perfectly in sync
              </p>
            </div>
          </div>

          <UserList />
        </header>

        {/* Connecting banner */}
        {!isConnected && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200 backdrop-blur-xl">
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting to the party…
          </div>
        )}

        {/* Theater card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6">
          <div className="mb-5">
            <VideoUrlInput socket={socket} />
          </div>

          <VideoPlayer
            videoId={videoId}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
          />
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Play, pause, seek or switch videos — everyone stays in sync.
        </p>
      </div>
    </div>
  );
}
