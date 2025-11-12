"use client";

import { useSessionStore } from "../../lib/stores/sessionStore";

interface SeekButtonProps {
  seconds: number;
  label: React.ReactNode;
  onSeek: (time: number) => void;
}

export function SeekButton({ seconds, label, onSeek }: SeekButtonProps) {
  const { videoId } = useSessionStore();

  const handleClick = () => {
    onSeek(seconds);
  };

  if (!videoId) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="px-3 py-3 bg-black/50 text-white rounded-full hover:bg-black/70 focus:outline-none"
    >
      {label}
    </button>
  );
}
