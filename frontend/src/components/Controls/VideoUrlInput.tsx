import { useState } from "react";
import { Youtube, Plus, ExternalLink } from "lucide-react";
import type { Socket } from "socket.io-client";
import { useSessionStore } from "../../lib/stores/sessionStore";

interface VideoUrlInputProps {
  socket: Socket | null;
}

const EQ_DELAYS = ["0s", "0.15s", "0.3s", "0.45s"];

export function VideoUrlInput({ socket }: VideoUrlInputProps) {
  const [url, setUrl] = useState("");
  const { videoUrl, isPlaying } = useSessionStore();

  const extractVideoId = (value: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !socket) return;

    const videoId = extractVideoId(url);
    if (videoId) {
      const trimmed = url.trim();
      // If a bare video ID was pasted, expand it to a full YouTube link so the
      // "Now Playing" chip shows a real, clickable URL.
      const normalizedUrl = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://www.youtube.com/watch?v=${videoId}`;
      socket.emit("changeVideo", {
        url: normalizedUrl,
        timestamp: Date.now(),
      });
      setUrl("");
    } else {
      alert("Please enter a valid YouTube URL");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Youtube className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-rose-400/80" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube URL or video ID…"
            className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none transition focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/30"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:from-violet-400 hover:to-fuchsia-500 hover:shadow-fuchsia-500/40 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Load Video
        </button>
      </div>
      {videoUrl && (
        <a
          href={videoUrl}
          target="_blank"
          rel="noreferrer"
          className="group mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 transition hover:border-fuchsia-400/30 hover:bg-white/[0.07]"
        >
          {/* Equalizer: animates while playing, settles flat when paused */}
          <span className="flex h-5 items-end gap-[3px]">
            {EQ_DELAYS.map((delay, i) => (
              <span
                key={i}
                className={`h-full w-1 origin-bottom rounded-full bg-gradient-to-t from-violet-500 to-fuchsia-400 ${
                  isPlaying ? "eq-bar" : "transition-transform duration-300"
                }`}
                style={
                  isPlaying
                    ? { animationDelay: delay }
                    : { transform: "scaleY(0.2)" }
                }
              />
            ))}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-fuchsia-300/80">
              {isPlaying ? "Now Playing" : "Paused"}
            </span>
            <span className="block truncate text-sm text-white/60 group-hover:text-white/80">
              {videoUrl}
            </span>
          </span>

          <ExternalLink className="h-4 w-4 shrink-0 text-white/30 transition group-hover:text-fuchsia-300/70" />
        </a>
      )}
    </form>
  );
}
