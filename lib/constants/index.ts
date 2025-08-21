import { VoteValue } from '@/lib/types/vote';

export const VOTE_CARDS: VoteValue[] = [1, 2, 3, 5, 8, 13, 21, 'coffee'];

export const SESSION_LIMITS = {
  MAX_CONCURRENT_SESSIONS: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '3', 10),
  MAX_USERS_PER_SESSION: parseInt(process.env.MAX_USERS_PER_SESSION || '16', 10),
  SESSION_TIMEOUT_MINUTES: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '10', 10),
  SCRUM_MASTER_GRACE_PERIOD_MINUTES: parseInt(
    process.env.SCRUM_MASTER_GRACE_PERIOD_MINUTES || '5',
    10
  ),
} as const;

export const SOCKET_CONFIG = {
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
  RECONNECTION_DELAY_MAX: 5000,
  TIMEOUT: 20000,
} as const;

export const AVATARS = [
  '🦊', '🐻', '🐼', '🦁', '🐯', '🐨', '🐸', '🦉',
  '🦄', '🐙', '🦋', '🐢', '🐧', '🦜', '🦩', '🦔'
] as const;

export const MESSAGES = {
  SESSION_EXPIRED: 'Session expired due to inactivity',
  SESSION_FULL: 'Session is full (maximum 16 users)',
  SESSION_NOT_FOUND: 'Session not found',
  INVALID_SESSION: 'Invalid session',
  SCRUM_MASTER_DISCONNECTED: 'Waiting for Scrum Master to return',
  SCRUM_MASTER_TRANSFERRED: 'Scrum Master role has been transferred',
  VOTING_IN_PROGRESS: 'Voting is in progress',
  VOTING_NOT_STARTED: 'Voting has not started',
  ALREADY_VOTED: 'You have already voted',
  NOT_AUTHORIZED: 'You are not authorized to perform this action',
  MAX_SESSIONS_REACHED: 'Maximum number of concurrent sessions reached',
} as const;