import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { SessionRepository } from './infrastructure/session/SessionRepository';
import { SyncEngine } from './domain/SyncEngine';
import { setupSocketIO } from './infrastructure/socket/socketHandler';
import { healthCheck } from './api/health';

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', healthCheck);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Initialize session and sync engine
const sessionRepository = new SessionRepository();
const session = sessionRepository.getSession();
const syncEngine = new SyncEngine(session);

// Setup socket handlers
setupSocketIO(io, session, syncEngine);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${corsOptions.origin}`);
});

