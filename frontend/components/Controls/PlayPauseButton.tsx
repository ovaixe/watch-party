"use client";

import { Play } from "lucide-react";
import { Pause } from "lucide-react";

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
      className="px-3 py-3 bg-black/50 text-white rounded-full hover:bg-black/70 focus:outline-none"
    >
      {isPlaying ? <Pause /> : <Play />}
    </button>
  );
}
