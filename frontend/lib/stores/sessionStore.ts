'use client';

import { create } from 'zustand';
import { SessionState } from '../../types/session';

interface SessionStore {
  videoUrl: string | null;
  videoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  connectedUsers: number;
  isConnected: boolean;
  
  // Actions
  setVideoUrl: (url: string | null) => void;
  setVideoId: (id: string | null) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setConnectedUsers: (count: number) => void;
  setConnected: (connected: boolean) => void;
  syncToState: (state: SessionState) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  videoUrl: null,
  videoId: null,
  isPlaying: false,
  currentTime: 0,
  connectedUsers: 0,
  isConnected: false,

  setVideoUrl: (url) => set({ videoUrl: url }),
  setVideoId: (id) => set({ videoId: id }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setConnectedUsers: (count) => set({ connectedUsers: count }),
  setConnected: (connected) => set({ isConnected: connected }),
  
  syncToState: (state) => set({
    videoUrl: state.videoUrl,
    videoId: state.videoId,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    connectedUsers: state.connectedUsers,
  }),
  
  reset: () => set({
    videoUrl: null,
    videoId: null,
    isPlaying: false,
    currentTime: 0,
    connectedUsers: 0,
    isConnected: false,
  }),
}));

