'use client';

import { useSessionStore } from '../../lib/stores/sessionStore';

export function UserList() {
  const { connectedUsers, isConnected } = useSessionStore();

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-gray-600">
        {isConnected
          ? `${connectedUsers} user${connectedUsers !== 1 ? 's' : ''} connected`
          : 'Disconnected'}
      </span>
    </div>
  );
}

