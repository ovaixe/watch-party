import { Server, Socket } from 'socket.io';
import { Session } from '../../domain/Session';
import { SyncEngine } from '../../domain/SyncEngine';
import { SocketEventHandlers } from './eventHandlers';

export function setupSocketIO(io: Server, session: Session, syncEngine: SyncEngine): void {
  const eventHandlers = new SocketEventHandlers(io, session, syncEngine);
  
  io.on('connection', (socket: Socket) => {
    eventHandlers.handleConnection(socket);
  });

  eventHandlers.startPeriodicSync();
}

