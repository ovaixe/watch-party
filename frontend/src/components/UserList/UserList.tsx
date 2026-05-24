import { Users } from "lucide-react";
import { useSessionStore } from "../../lib/stores/sessionStore";

export function UserList() {
  const { connectedUsers, isConnected } = useSessionStore();

  return (
    <div className="inline-flex items-center gap-3 self-start rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 backdrop-blur-xl">
      <span className="relative flex items-center">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isConnected ? "live-dot bg-green-400" : "bg-rose-500"
          }`}
        />
      </span>

      {isConnected ? (
        <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
          <Users className="h-4 w-4 text-white/50" />
          {connectedUsers} watching
        </span>
      ) : (
        <span className="text-sm font-medium text-white/60">Offline</span>
      )}
    </div>
  );
}
