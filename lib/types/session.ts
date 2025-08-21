import { SessionUser } from './user';
import { Vote } from './vote';

export interface Session {
  id: string;
  name: string;
  users: Map<string, SessionUser>;
  scrumMasterId: string;
  currentRound?: VotingRound;
  createdAt: Date;
  lastActivityAt: Date;
  isPaused: boolean;
  scrumMasterDisconnectedAt?: Date;
}

export interface VotingRound {
  id: string;
  startedAt: Date;
  votes: Map<string, Vote>;
  isRevealed: boolean;
  revealedAt?: Date;
}

export interface SessionSummary {
  id: string;
  name: string;
  userCount: number;
  createdAt: Date;
}

export interface SessionState {
  session: Session;
  users: SessionUser[];
  currentRound?: VotingRound;
  votingStatus: Map<string, boolean>;
}