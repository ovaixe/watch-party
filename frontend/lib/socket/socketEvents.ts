'use client';

import { Socket } from 'socket.io-client';
import { ServerEvents, ClientEvents } from '../../types/events';
import { useSessionStore } from '../stores/sessionStore';

export function setupSocketListeners(
  socket: Socket<ServerEvents, ClientEvents>
): () => void {
  const { syncToState, setConnectedUsers, setConnected } = useSessionStore.getState();

  // Connection events
  socket.on('connect', () => {
    console.log('Connected to server');
    setConnected(true);
    // Request session state on connect to ensure we get it
    socket.emit('join');
    // Also request sync in case we missed the initial sessionState
    socket.emit('syncRequest');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    setConnected(false);
  });

  // Session state
  socket.on('sessionState', (state) => {
    console.log('Received session state:', state);
    syncToState(state);
  });

  // Playback events
  socket.on('play', () => {
    console.log('Server: play event received');
    const store = useSessionStore.getState();
    console.log('Current playing state before update:', store.isPlaying);
    store.setPlaying(true);
    console.log('Playing state after update:', useSessionStore.getState().isPlaying);
  });

  socket.on('pause', () => {
    console.log('Server: pause event received');
    const store = useSessionStore.getState();
    console.log('Current playing state before update:', store.isPlaying);
    store.setPlaying(false);
    console.log('Playing state after update:', useSessionStore.getState().isPlaying);
  });

  socket.on('seek', (data) => {
    console.log('Server: seek to', data.time);
    useSessionStore.getState().setCurrentTime(data.time);
  });

  socket.on('videoChanged', (data) => {
    console.log('Server: video changed', data);
    useSessionStore.getState().setVideoUrl(data.url);
    useSessionStore.getState().setVideoId(data.videoId);
    useSessionStore.getState().setCurrentTime(0);
    useSessionStore.getState().setPlaying(false);
  });

  socket.on('userJoined', (data) => {
    console.log('Users:', data.count);
    setConnectedUsers(data.count);
  });

  socket.on('userLeft', (data) => {
    setConnectedUsers(data.count);
  });

  socket.on('driftCorrection', (data) => {
    const store = useSessionStore.getState();
    const diff = Math.abs(store.currentTime - data.time);
    if (diff > 1) {
      console.log('Drift correction:', data.time, 'diff:', diff);
      store.setCurrentTime(data.time);
    }
  });

  // Cleanup function
  return () => {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('sessionState');
    socket.off('play');
    socket.off('pause');
    socket.off('seek');
    socket.off('videoChanged');
    socket.off('userJoined');
    socket.off('userLeft');
    socket.off('driftCorrection');
  };
}

