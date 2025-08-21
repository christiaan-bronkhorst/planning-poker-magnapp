import { v4 as uuidv4 } from 'uuid';
import { Session, SessionSummary, VotingRound } from '@/lib/types/session';
import { SessionUser } from '@/lib/types/user';
import { Vote, VoteValue, VoteStatistics } from '@/lib/types/vote';
import { SESSION_LIMITS, MESSAGES } from '@/lib/constants';

export class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, Session> = new Map();
  private sessionTimers: Map<string, NodeJS.Timeout> = new Map();
  private scrumMasterTimers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  createSession(name: string, creator: SessionUser): Session {
    if (this.sessions.size >= SESSION_LIMITS.MAX_CONCURRENT_SESSIONS) {
      throw new Error(MESSAGES.MAX_SESSIONS_REACHED);
    }

    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      name,
      users: new Map([[creator.id, creator]]),
      scrumMasterId: creator.id,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      isPaused: false,
    };

    this.sessions.set(sessionId, session);
    this.resetSessionTimer(sessionId);
    return session;
  }

  joinSession(sessionId: string, user: SessionUser): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(MESSAGES.SESSION_NOT_FOUND);
    }

    if (session.users.size >= SESSION_LIMITS.MAX_USERS_PER_SESSION) {
      throw new Error(MESSAGES.SESSION_FULL);
    }

    session.users.set(user.id, user);
    this.updateActivity(sessionId);
    return session;
  }

  removeUserFromSession(sessionId: string, userId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.users.delete(userId);
    
    if (session.users.size === 0) {
      this.endSession(sessionId);
      return null;
    }

    if (session.scrumMasterId === userId) {
      this.handleScrumMasterDisconnection(sessionId);
    }

    this.updateActivity(sessionId);
    return session;
  }

  private handleScrumMasterDisconnection(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isPaused = true;
    session.scrumMasterDisconnectedAt = new Date();

    const timer = setTimeout(() => {
      this.autoTransferScrumMaster(sessionId);
    }, SESSION_LIMITS.SCRUM_MASTER_GRACE_PERIOD_MINUTES * 60 * 1000);

    this.scrumMasterTimers.set(sessionId, timer);
  }

  private autoTransferScrumMaster(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.users.size === 0) return;

    const connectedUsers = Array.from(session.users.values())
      .filter(u => u.isConnected)
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

    if (connectedUsers.length > 0) {
      const newScrumMaster = connectedUsers[0];
      session.scrumMasterId = newScrumMaster.id;
      newScrumMaster.isScrumMaster = true;
      session.isPaused = false;
      session.scrumMasterDisconnectedAt = undefined;
    }

    this.clearScrumMasterTimer(sessionId);
  }

  reconnectUser(sessionId: string, userId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const user = session.users.get(userId);
    if (!user) return null;

    user.isConnected = true;

    if (session.scrumMasterId === userId && session.isPaused) {
      session.isPaused = false;
      session.scrumMasterDisconnectedAt = undefined;
      this.clearScrumMasterTimer(sessionId);
    }

    this.updateActivity(sessionId);
    return session;
  }

  startVotingRound(sessionId: string): VotingRound {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(MESSAGES.SESSION_NOT_FOUND);
    }

    const round: VotingRound = {
      id: uuidv4(),
      startedAt: new Date(),
      votes: new Map(),
      isRevealed: false,
    };

    session.currentRound = round;
    session.users.forEach(user => {
      user.hasVoted = false;
    });

    this.updateActivity(sessionId);
    return round;
  }

  submitVote(sessionId: string, userId: string, value: VoteValue): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(MESSAGES.SESSION_NOT_FOUND);
    }

    if (!session.currentRound) {
      throw new Error(MESSAGES.VOTING_NOT_STARTED);
    }

    if (session.currentRound.isRevealed) {
      throw new Error(MESSAGES.VOTING_NOT_STARTED);
    }

    const user = session.users.get(userId);
    if (!user) {
      throw new Error(MESSAGES.INVALID_SESSION);
    }

    const vote: Vote = {
      userId,
      value,
      submittedAt: new Date(),
    };

    session.currentRound.votes.set(userId, vote);
    user.hasVoted = true;
    this.updateActivity(sessionId);
  }

  revealVotes(sessionId: string): { votes: Vote[]; statistics: VoteStatistics } {
    const session = this.sessions.get(sessionId);
    if (!session || !session.currentRound) {
      throw new Error(MESSAGES.SESSION_NOT_FOUND);
    }

    session.currentRound.isRevealed = true;
    session.currentRound.revealedAt = new Date();

    const votes = Array.from(session.currentRound.votes.values());
    const statistics = this.calculateStatistics(votes);

    this.updateActivity(sessionId);
    return { votes, statistics };
  }

  private calculateStatistics(votes: Vote[]): VoteStatistics {
    const distribution = new Map<VoteValue, number>();
    const numericVotes: number[] = [];
    let coffeeVotes = 0;

    votes.forEach(vote => {
      const count = distribution.get(vote.value) || 0;
      distribution.set(vote.value, count + 1);

      if (vote.value === 'coffee') {
        coffeeVotes++;
      } else {
        numericVotes.push(vote.value as number);
      }
    });

    const average = numericVotes.length > 0
      ? numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length
      : null;

    const hasConsensus = distribution.size === 1 && votes.length > 1;

    return {
      average,
      distribution,
      hasConsensus,
      totalVotes: votes.length,
      coffeeVotes,
    };
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getActiveSessions(): SessionSummary[] {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      name: session.name,
      userCount: session.users.size,
      createdAt: session.createdAt,
    }));
  }

  endSession(sessionId: string): void {
    this.clearSessionTimer(sessionId);
    this.clearScrumMasterTimer(sessionId);
    this.sessions.delete(sessionId);
  }

  private updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityAt = new Date();
      this.resetSessionTimer(sessionId);
    }
  }

  private resetSessionTimer(sessionId: string): void {
    this.clearSessionTimer(sessionId);
    
    const timer = setTimeout(() => {
      this.endSession(sessionId);
    }, SESSION_LIMITS.SESSION_TIMEOUT_MINUTES * 60 * 1000);

    this.sessionTimers.set(sessionId, timer);
  }

  private clearSessionTimer(sessionId: string): void {
    const timer = this.sessionTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.sessionTimers.delete(sessionId);
    }
  }

  private clearScrumMasterTimer(sessionId: string): void {
    const timer = this.scrumMasterTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.scrumMasterTimers.delete(sessionId);
    }
  }

  expireInactiveSessions(): void {
    const now = new Date();
    const timeout = SESSION_LIMITS.SESSION_TIMEOUT_MINUTES * 60 * 1000;

    this.sessions.forEach((session, sessionId) => {
      const timeSinceActivity = now.getTime() - session.lastActivityAt.getTime();
      if (timeSinceActivity > timeout) {
        this.endSession(sessionId);
      }
    });
  }
}