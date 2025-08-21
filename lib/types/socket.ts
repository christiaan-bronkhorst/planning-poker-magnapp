import { User, SessionUser } from './user';
import { Session, SessionSummary, VotingRound } from './session';
import { VoteValue, VoteStatistics } from './vote';

export interface ServerToClientEvents {
  sessionUpdated: (session: Session) => void;
  userJoined: (user: SessionUser) => void;
  userLeft: (userId: string) => void;
  userDisconnected: (userId: string) => void;
  userReconnected: (userId: string) => void;
  votingStarted: (round: VotingRound) => void;
  voteSubmitted: (userId: string) => void;
  votesRevealed: (votes: Array<{ userId: string; value: VoteValue }>, statistics: VoteStatistics) => void;
  newRoundStarted: (round: VotingRound) => void;
  sessionEnded: (reason: string) => void;
  scrumMasterChanged: (newScrumMasterId: string) => void;
  sessionPaused: (reason: string) => void;
  sessionResumed: () => void;
  sessionExpiring: (secondsRemaining: number) => void;
  error: (message: string) => void;
  activeSessions: (sessions: SessionSummary[]) => void;
}

export interface ClientToServerEvents {
  createSession: (name: string, user: User) => void;
  joinSession: (sessionId: string, user: User) => void;
  leaveSession: () => void;
  startVoting: () => void;
  submitVote: (value: VoteValue) => void;
  revealVotes: () => void;
  startNewRound: () => void;
  endSession: () => void;
  kickUser: (userId: string) => void;
  transferScrumMaster: (userId: string) => void;
  getActiveSessions: () => void;
  reconnect: (sessionId: string, userId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  sessionId?: string;
  userName: string;
}