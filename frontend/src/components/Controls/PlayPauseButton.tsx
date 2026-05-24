import { Play, Pause } from "lucide-react";
import { useSessionStore } from "../../lib/stores/sessionStore";

interface PlayPauseButtonProps {
  togglePlayPause: () => void;
}

export function PlayPauseButton({ togglePlayPause }: PlayPauseButtonProps) {
  const { isPlaying, videoId } = useSessionStore();

  if (!videoId) {
    return null;
  }

  return (
    <button
      onClick={togglePlayPause}
      aria-label={isPlaying ? "Pause" : "Play"}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-105 hover:shadow-fuchsia-500/50 active:scale-95"
    >
      {isPlaying ? (
        <Pause className="h-5 w-5 fill-current" />
      ) : (
        <Play className="h-5 w-5 translate-x-0.5 fill-current" />
      )}
    </button>
  );
}
