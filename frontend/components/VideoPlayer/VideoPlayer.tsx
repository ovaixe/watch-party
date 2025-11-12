"use client";

import { useState, useRef, useEffect } from "react";
import YouTube, {
  YouTubePlayer as YouTubePlayerType,
  YouTubeEvent,
} from "react-youtube";
import { Rewind, FastForward, Volume2 } from "lucide-react";

import { useSocket } from "../../hooks/useSocket";
import { PlayPauseButton } from "../../components/Controls/PlayPauseButton";
import { SeekButton } from "../../components/Controls/SeekButton";

// Import PlayerState if using official types, or define it locally
const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

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
  const [player, setPlayer] = useState<YouTubePlayerType | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const socket = useSocket();

  // YouTube player options
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

  // Event handlers for YouTube player
  const onReady = (event: YouTubeEvent) => {
    const playerInstance = event.target;
    setPlayer(playerInstance);
    setDuration(playerInstance.getDuration());
    setCurTime(currentTime);
    setIsReady(true);
  };

  const onStateChange = (event: YouTubeEvent) => {
    const playerState = event.data;

    // Use the locally defined PlayerState
    if (playerState === PlayerState.PLAYING) {
      startProgressUpdate();
      onPlay();
    } else if (playerState === PlayerState.PAUSED) {
      stopProgressUpdate();
      onPause();
    } else if (playerState === PlayerState.ENDED) {
      stopProgressUpdate();
      onPause();
    }
  };

  // Progress tracking
  const startProgressUpdate = () => {
    updateIntervalRef.current = setInterval(() => {
      if (player && typeof player.getCurrentTime === "function") {
        setCurTime(player.getCurrentTime());
      }
    }, 1000);
  };

  const stopProgressUpdate = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  // Custom control functions
  const togglePlayPause = () => {
    if (!player || !socket) return;

    if (isPlaying) {
      player.pauseVideo();
      onPause();
    } else {
      player.playVideo();
      onPlay();
    }
  };

  const seekTo = (seconds: number) => {
    if (!socket || !videoId) return;

    const newTime = Math.min(
      Math.max(0, player.getCurrentTime() + seconds),
      duration
    );
    onSeek(newTime);

    if (player) {
      player.seekTo(newTime, true);
      setCurTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Sync Play/Pause
  useEffect(() => {
    if (!player || !isReady) return;

    if (
      player.getPlayerState() === PlayerState.UNSTARTED ||
      player.getPlayerState() === PlayerState.CUED
    ) {
      return;
    }

    try {
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    } catch (error) {
      console.error("Player not ready yet, retrying...", error);
    }
  }, [player, isPlaying, isReady]);

  // Sync Current Time
  useEffect(() => {
    if (!player || !isReady) return;

    if (
      player.getPlayerState() === PlayerState.UNSTARTED ||
      player.getPlayerState() === PlayerState.CUED
    ) {
      return;
    }

    try {
      player.seekTo(currentTime, true);
    } catch (error) {
      console.error("Error seeking to current time >>>>>", error);
    }
  }, [player, isReady, currentTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressUpdate();
    };
  }, []);

  const progressPercentage = duration > 0 ? (curTime / duration) * 100 : 0;

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center">
        <p>Enter a YouTube URL to start watching</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* YouTube Player */}
      <YouTube
        videoId={videoId ?? undefined}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
      />

      {/* Custom Controls */}
      <div className="w-full p-4 bg-gradient-to-b from-gray-50 to-white">
        {/* Progress Bar */}
        <div
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer mb-4"
          ref={progressRef}
          //   onClick={handleProgressClick}
        >
          <div
            className="h-full bg-red-600 rounded-full transition-all duration-200"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Time Display - Top on mobile, left on desktop */}
          <div className="text-sm font-medium text-gray-700 order-1 sm:order-none">
            {formatTime(curTime)} / {formatTime(duration)}
          </div>

          {/* Playback Controls - Center */}
          <div className="flex items-center gap-1 sm:gap-2 order-3 sm:order-none">
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

          {/* Volume Controls - Right */}
          <div className="flex items-center gap-2 order-2 sm:order-none">
            <Volume2 size={18} className="text-gray-600" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-28 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600"
              aria-label="Volume control"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
