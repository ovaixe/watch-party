'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { createSocketClient } from '../lib/socket/socketClient';
import { setupSocketListeners } from '../lib/socket/socketEvents';

export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) return;
    initializedRef.current = true;

    const newSocket = createSocketClient();
    // Set up listeners BEFORE socket might connect
    const cleanup = setupSocketListeners(newSocket);
    cleanupRef.current = cleanup;
    
    // Set socket state - using requestAnimationFrame to avoid synchronous setState warning
    // This is necessary to provide the socket to components immediately
    requestAnimationFrame(() => {
      setSocket(newSocket);
    });

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (newSocket) {
        newSocket.disconnect();
      }
      setSocket(null);
      initializedRef.current = false;
    };
  }, []);

  return socket;
}

