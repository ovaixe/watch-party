'use client';

import { useSessionStore } from '../lib/stores/sessionStore';
import { Socket } from 'socket.io-client';

export function useSessionSync(socket: Socket | null) {
  const { videoId, setPlaying, setCurrentTime } = useSessionStore();

  const handlePlay = () => {
    if (socket && videoId) {
      socket.emit('play', { timestamp: Date.now() });
      setPlaying(true);
    }
  };

  const handlePause = () => {
    if (socket && videoId) {
      socket.emit('pause', { timestamp: Date.now() });
      setPlaying(false);
    }
  };

  const handleSeek = (time: number) => {
    if (socket && videoId) {
      socket.emit('seek', {
        time,
        timestamp: Date.now(),
      });
      setCurrentTime(time);
    }
  };

  return {
    handlePlay,
    handlePause,
    handleSeek,
  };
}

