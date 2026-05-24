import type { ReactNode } from "react";
import { useSessionStore } from "../../lib/stores/sessionStore";

interface SeekButtonProps {
  seconds: number;
  label: ReactNode;
  onSeek: (time: number) => void;
}

export function SeekButton({ seconds, label, onSeek }: SeekButtonProps) {
  const { videoId } = useSessionStore();

  if (!videoId) {
    return null;
  }

  return (
    <button
      onClick={() => onSeek(seconds)}
      aria-label={seconds < 0 ? "Rewind" : "Fast forward"}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
    >
      {label}
    </button>
  );
}
