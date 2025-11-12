'use client';

import { useState } from 'react';
import { useSessionStore } from '../../lib/stores/sessionStore';

interface VideoUrlInputProps {
  socket: any;
}

export function VideoUrlInput({ socket }: VideoUrlInputProps) {
  const [url, setUrl] = useState('');
  const { videoUrl } = useSessionStore();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
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
      socket.emit('changeVideo', {
        url: url.trim(),
        timestamp: Date.now(),
      });
      setUrl('');
    } else {
      alert('Please enter a valid YouTube URL');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube URL or Video ID"
          className="text-black flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Load Video
        </button>
      </div>
      {videoUrl && (
        <p className="mt-2 text-sm text-gray-600">
          Current: {videoUrl}
        </p>
      )}
    </form>
  );
}

