import { SessionState } from '../types/events';

export interface Session extends Omit<SessionState, 'connectedUsers'> {
  connectedUsers: Set<string>;
}

export type ActionType = 'play' | 'pause' | 'seek' | 'changeVideo';

export interface Action {
  type: ActionType;
  timestamp: number;
  data?: any;
}

