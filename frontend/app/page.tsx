"use client";

import { useSocket } from "../hooks/useSocket";
import { useSessionStore } from "../lib/stores/sessionStore";
import { useSessionSync } from "../hooks/useSessionSync";
import VideoPlayer from "../components/VideoPlayer/VideoPlayer";
import { VideoUrlInput } from "../components/Controls/VideoUrlInput";
import { UserList } from "../components/UserList/UserList";

export default function Home() {
  const socket = useSocket();
  const { videoId, isPlaying, currentTime, isConnected } = useSessionStore();
  const { handlePlay, handlePause, handleSeek } = useSessionSync(socket);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Watch Party
            </h1>
            <p className="text-gray-600">
              Watch YouTube videos together in real-time
            </p>
          </header>

          {!isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                Connecting to server... Please wait.
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="mb-6">
              <VideoUrlInput socket={socket} />
            </div>

            <div className="mb-6">
              <VideoPlayer
                videoId={videoId}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
              />
            </div>

            <UserList />
          </div>
        </div>
      </div>
    </div>
  );
}
