import { useState, useRef, useEffect } from "react";
import YouTube, {
  type YouTubePlayer as YouTubePlayerType,
  type YouTubeEvent,
} from "react-youtube";
import { Rewind, FastForward, Volume2, VolumeX, MonitorPlay } from "lucide-react";

import { useSessionStore } from "../../lib/stores/sessionStore";
import { PlayPauseButton } from "../Controls/PlayPauseButton";
import { SeekButton } from "../Controls/SeekButton";

// YouTube IFrame player states.
const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

// Only re-seek the local player when it has drifted more than this from the
// shared time. Keeps drift corrections from causing constant micro-seeks.
const SEEK_THRESHOLD_SECONDS = 1.5;

interface YouTubePlayerProps {
  videoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
}

const YouTubePlayer = ({
  videoId,
  isPlaying,
  currentTime,
  onPlay,
  onPause,
  onSeek,
}: YouTubePlayerProps) => {
  const [curTime, setCurTime] = useState<number>(currentTime);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(50);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [player, setPlayer] = useState<YouTubePlayerType | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Whether the user has interacted with the page. Browsers block unmuted
  // autoplay until then, so a sync-driven play before any gesture must start
  // muted (with a "tap to unmute" prompt) to actually play in sync.
  const userActivatedRef = useRef(false);

  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
    },
  };

  // Treat any interaction anywhere on the page as a user gesture.
  useEffect(() => {
    const activate = () => {
      userActivatedRef.current = true;
    };
    window.addEventListener("pointerdown", activate);
    window.addEventListener("keydown", activate);
    return () => {
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("keydown", activate);
    };
  }, []);

  const onReady = (event: YouTubeEvent) => {
    const playerInstance = event.target;
    setPlayer(playerInstance);
    setDuration(playerInstance.getDuration());
    setCurTime(currentTime);
    setIsReady(true);
  };

  // Single point that broadcasts playback intent. We only emit when the
  // player's new state DIVERGES from the shared store state — i.e. a genuine
  // local user action. State changes that merely mirror a remote command (the
  // store already matches) are echoes and must not be re-broadcast.
  const onStateChange = (event: YouTubeEvent) => {
    const playerState = event.data;
    const storePlaying = useSessionStore.getState().isPlaying;

    // Keep duration in sync with whatever video is actually loaded.
    const dur = event.target.getDuration?.();
    if (dur && dur > 0) setDuration(dur);

    if (playerState === PlayerState.PLAYING) {
      startProgressUpdate();
      if (!storePlaying) onPlay();
    } else if (playerState === PlayerState.PAUSED) {
      stopProgressUpdate();
      if (storePlaying) onPause();
    } else if (playerState === PlayerState.ENDED) {
      stopProgressUpdate();
      if (storePlaying) onPause();
    }
  };

  const startProgressUpdate = () => {
    if (updateIntervalRef.current) return;
    updateIntervalRef.current = setInterval(() => {
      if (player && typeof player.getCurrentTime === "function") {
        try {
          setCurTime(player.getCurrentTime());
          const dur = player.getDuration?.();
          if (dur && dur > 0) setDuration(dur);
        } catch {
          // Player may be mid-recreation (video switch); ignore this tick.
        }
      }
    }, 1000);
  };

  const stopProgressUpdate = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  const unmute = () => {
    userActivatedRef.current = true;
    if (player) {
      player.unMute();
      player.setVolume(volume === 0 ? 50 : volume);
      if (volume === 0) setVolume(50);
    }
    setIsMuted(false);
  };

  // Our custom controls only drive the player; onStateChange handles emitting.
  const togglePlayPause = () => {
    if (!player) return;
    userActivatedRef.current = true;
    if (isMuted) unmute();
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  // Seeking has no dedicated player event, so emit it explicitly here.
  const seekTo = (seconds: number) => {
    if (!player || !videoId) return;
    userActivatedRef.current = true;

    const newTime = Math.min(
      Math.max(0, player.getCurrentTime() + seconds),
      duration,
    );
    player.seekTo(newTime, true);
    setCurTime(newTime);
    onSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    userActivatedRef.current = true;
    setVolume(newVolume);
    if (player) {
      if (newVolume > 0 && isMuted) {
        player.unMute();
        setIsMuted(false);
      }
      player.setVolume(newVolume);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Apply the shared play/pause state to the player. Runs even from CUED /
  // UNSTARTED so a user who joins a playing session actually starts. If they
  // haven't interacted yet, mute first so the browser permits autoplay.
  useEffect(() => {
    if (!player || !isReady) return;
    try {
      const state = player.getPlayerState();
      const playing =
        state === PlayerState.PLAYING || state === PlayerState.BUFFERING;
      if (isPlaying && !playing) {
        if (!userActivatedRef.current) {
          player.mute();
          setIsMuted(true);
        }
        player.playVideo();
      } else if (!isPlaying && playing) {
        player.pauseVideo();
      }
    } catch (error) {
      console.error("Error applying play state", error);
    }
  }, [player, isPlaying, isReady]);

  // Apply the shared time to the player, but only when meaningfully off — this
  // syncs remote seeks / new joiners and absorbs periodic drift corrections
  // without yanking playback around.
  useEffect(() => {
    if (!player || !isReady) return;
    try {
      const actual = player.getCurrentTime() ?? 0;
      if (Math.abs(actual - currentTime) > SEEK_THRESHOLD_SECONDS) {
        player.seekTo(currentTime, true);
        setCurTime(currentTime);
      }
    } catch (error) {
      console.error("Error syncing time", error);
    }
  }, [player, isReady, currentTime]);

  // When the video changes, react-youtube destroys and recreates the player.
  // Stop the progress interval bound to the old player and clear the previous
  // video's displayed time/duration, so we don't keep showing the old
  // timestamp. The interval restarts against the new player once it plays.
  useEffect(() => {
    stopProgressUpdate();
    setCurTime(0);
    setDuration(0);
  }, [videoId]);

  useEffect(() => {
    return () => {
      stopProgressUpdate();
    };
  }, []);

  const progressPercentage = duration > 0 ? (curTime / duration) * 100 : 0;

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-black/30 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <MonitorPlay className="h-8 w-8 text-fuchsia-300/80" />
        </div>
        <div>
          <p className="text-base font-semibold text-white/80">
            The screen is yours
          </p>
          <p className="mt-1 text-sm text-white/40">
            Paste a YouTube link above to start the party
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/50">
      {/* YouTube Player (responsive 16:9) */}
      <div className="relative aspect-video w-full bg-black">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          className="h-full w-full"
          iframeClassName="h-full w-full"
        />

        {/* Muted-autoplay prompt: shown when we auto-muted to start in sync */}
        {isMuted && (
          <button
            onClick={unmute}
            className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-2 rounded-full bg-fuchsia-600/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-900/50 backdrop-blur transition hover:bg-fuchsia-500"
          >
            <VolumeX className="h-4 w-4" />
            Tap to unmute
          </button>
        )}
      </div>

      {/* Custom Controls */}
      <div className="w-full bg-gradient-to-b from-zinc-900/90 to-black p-4">
        {/* Progress Bar */}
        <div className="group mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.7)] transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Control row */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Time */}
          <div className="order-1 font-mono text-sm tabular-nums text-white/60 sm:order-none">
            <span className="text-white/90">{formatTime(curTime)}</span> /{" "}
            {formatTime(duration)}
          </div>

          {/* Playback controls */}
          <div className="order-3 flex items-center gap-3 sm:order-none">
            <SeekButton
              seconds={-10}
              label={<Rewind size={18} />}
              onSeek={seekTo}
            />
            <PlayPauseButton togglePlayPause={togglePlayPause} />
            <SeekButton
              seconds={10}
              label={<FastForward size={18} />}
              onSeek={seekTo}
            />
          </div>

          {/* Volume */}
          <div className="order-2 flex items-center gap-2 sm:order-none">
            <button
              onClick={() => (isMuted ? unmute() : undefined)}
              aria-label={isMuted ? "Unmute" : "Volume"}
              className="text-white/50 transition hover:text-white/80"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 sm:w-28"
              aria-label="Volume control"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
