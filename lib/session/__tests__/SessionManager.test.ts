import { SessionManager } from '../SessionManager';
import { SessionUser } from '@/lib/types/user';
import { MESSAGES } from '@/lib/constants';

describe('SessionManager', () => {
  let manager: SessionManager;
  let mockUser: SessionUser;

  beforeEach(() => {
    manager = new SessionManager();
    mockUser = {
      id: 'user-1',
      name: 'Test User',
      avatar: '🦊',
      isConnected: true,
      hasVoted: false,
      isScrumMaster: true,
      joinedAt: new Date(),
    };
  });

  describe('createSession', () => {
    it('creates session with unique GUID', () => {
      const session = manager.createSession('Test Session', mockUser);
      
      expect(session.id).toBeDefined();
      expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(session.name).toBe('Test Session');
      expect(session.scrumMasterId).toBe(mockUser.id);
      expect(session.users.get(mockUser.id)).toEqual(mockUser);
    });

    it('enforces 3 concurrent sessions limit', () => {
      const users = Array.from({ length: 4 }, (_, i) => ({
        ...mockUser,
        id: `user-${i}`,
      }));

      manager.createSession('Session 1', users[0]);
      manager.createSession('Session 2', users[1]);
      manager.createSession('Session 3', users[2]);

      expect(() => {
        manager.createSession('Session 4', users[3]);
      }).toThrow(MESSAGES.MAX_SESSIONS_REACHED);
    });

    it('creates different GUIDs for each session', () => {
      const user2 = { ...mockUser, id: 'user-2' };
      const session1 = manager.createSession('Session 1', mockUser);
      const session2 = manager.createSession('Session 2', user2);
      
      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('joinSession', () => {
    let sessionId: string;

    beforeEach(() => {
      const session = manager.createSession('Test Session', mockUser);
      sessionId = session.id;
    });

    it('allows users to join existing session', () => {
      const newUser: SessionUser = {
        ...mockUser,
        id: 'user-2',
        name: 'User 2',
        isScrumMaster: false,
      };

      const session = manager.joinSession(sessionId, newUser);
      expect(session.users.size).toBe(2);
      expect(session.users.get('user-2')).toEqual(newUser);
    });

    it('enforces 16 users per session limit', () => {
      const users = Array.from({ length: 15 }, (_, i) => ({
        ...mockUser,
        id: `user-${i + 2}`,
        name: `User ${i + 2}`,
        isScrumMaster: false,
      }));

      users.forEach(user => {
        manager.joinSession(sessionId, user);
      });

      const extraUser = { ...mockUser, id: 'user-17', isScrumMaster: false };
      expect(() => {
        manager.joinSession(sessionId, extraUser);
      }).toThrow(MESSAGES.SESSION_FULL);
    });

    it('throws error for non-existent session', () => {
      const newUser = { ...mockUser, id: 'user-2', isScrumMaster: false };
      
      expect(() => {
        manager.joinSession('invalid-id', newUser);
      }).toThrow(MESSAGES.SESSION_NOT_FOUND);
    });
  });

  describe('removeUserFromSession', () => {
    let sessionId: string;

    beforeEach(() => {
      const session = manager.createSession('Test Session', mockUser);
      sessionId = session.id;
    });

    it('removes user from session', () => {
      const user2 = { ...mockUser, id: 'user-2', isScrumMaster: false };
      manager.joinSession(sessionId, user2);
      
      const session = manager.removeUserFromSession(sessionId, 'user-2');
      expect(session?.users.size).toBe(1);
      expect(session?.users.has('user-2')).toBe(false);
    });

    it('ends session when last user leaves', () => {
      manager.removeUserFromSession(sessionId, mockUser.id);
      
      const session = manager.getSession(sessionId);
      expect(session).toBeUndefined();
    });

    it('pauses session when Scrum Master disconnects', () => {
      const user2 = { ...mockUser, id: 'user-2', isScrumMaster: false };
      manager.joinSession(sessionId, user2);
      
      const session = manager.removeUserFromSession(sessionId, mockUser.id);
      expect(session?.isPaused).toBe(true);
      expect(session?.scrumMasterDisconnectedAt).toBeDefined();
    });
  });

  describe('voting functionality', () => {
    let sessionId: string;

    beforeEach(() => {
      const session = manager.createSession('Test Session', mockUser);
      sessionId = session.id;
    });

    it('starts a voting round', () => {
      const round = manager.startVotingRound(sessionId);
      
      expect(round.id).toBeDefined();
      expect(round.isRevealed).toBe(false);
      expect(round.votes.size).toBe(0);
      
      const session = manager.getSession(sessionId);
      expect(session?.currentRound).toBe(round);
    });

    it('handles vote submission', () => {
      manager.startVotingRound(sessionId);
      manager.submitVote(sessionId, mockUser.id, 8);
      
      const session = manager.getSession(sessionId);
      expect(session?.currentRound?.votes.size).toBe(1);
      expect(session?.users.get(mockUser.id)?.hasVoted).toBe(true);
    });

    it('prevents voting when no round active', () => {
      expect(() => {
        manager.submitVote(sessionId, mockUser.id, 5);
      }).toThrow(MESSAGES.VOTING_NOT_STARTED);
    });

    it('reveals votes and calculates statistics', () => {
      const user2 = { ...mockUser, id: 'user-2', isScrumMaster: false };
      const user3 = { ...mockUser, id: 'user-3', isScrumMaster: false };
      
      manager.joinSession(sessionId, user2);
      manager.joinSession(sessionId, user3);
      manager.startVotingRound(sessionId);
      
      manager.submitVote(sessionId, mockUser.id, 8);
      manager.submitVote(sessionId, 'user-2', 5);
      manager.submitVote(sessionId, 'user-3', 'coffee');
      
      const { votes, statistics } = manager.revealVotes(sessionId);
      
      expect(votes.length).toBe(3);
      expect(statistics.average).toBe(6.5);
      expect(statistics.totalVotes).toBe(3);
      expect(statistics.coffeeVotes).toBe(1);
      expect(statistics.hasConsensus).toBe(false);
    });

    it('detects consensus when all votes are identical', () => {
      const user2 = { ...mockUser, id: 'user-2', isScrumMaster: false };
      
      manager.joinSession(sessionId, user2);
      manager.startVotingRound(sessionId);
      
      manager.submitVote(sessionId, mockUser.id, 8);
      manager.submitVote(sessionId, 'user-2', 8);
      
      const { statistics } = manager.revealVotes(sessionId);
      expect(statistics.hasConsensus).toBe(true);
    });
  });

  describe('session expiry', () => {
    it('expires inactive sessions after timeout', () => {
      jest.useFakeTimers();
      
      const session = manager.createSession('Test Session', mockUser);
      const sessionId = session.id;
      
      expect(manager.getSession(sessionId)).toBeDefined();
      
      // Fast-forward time by 10 minutes
      jest.advanceTimersByTime(10 * 60 * 1000);
      
      expect(manager.getSession(sessionId)).toBeUndefined();
      
      jest.useRealTimers();
    });

    it('resets timer on activity', () => {
      jest.useFakeTimers();
      
      const session = manager.createSession('Test Session', mockUser);
      const sessionId = session.id;
      
      // Fast-forward 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // Activity occurs
      manager.startVotingRound(sessionId);
      
      // Fast-forward another 6 minutes (total 11, but only 6 since last activity)
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      expect(manager.getSession(sessionId)).toBeDefined();
      
      // Fast-forward remaining 4 minutes to hit timeout
      jest.advanceTimersByTime(4 * 60 * 1000);
      
      expect(manager.getSession(sessionId)).toBeUndefined();
      
      jest.useRealTimers();
    });
  });

  describe('Scrum Master transfer', () => {
    it('transfers Scrum Master role after timeout', () => {
      jest.useFakeTimers();
      
      const session = manager.createSession('Test Session', mockUser);
      const sessionId = session.id;
      
      const user2: SessionUser = { 
        ...mockUser, 
        id: 'user-2', 
        isScrumMaster: false,
        isConnected: true,
      };
      manager.joinSession(sessionId, user2);
      
      // Scrum Master disconnects
      manager.removeUserFromSession(sessionId, mockUser.id);
      
      // Fast-forward 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      const updatedSession = manager.getSession(sessionId);
      expect(updatedSession?.scrumMasterId).toBe('user-2');
      expect(updatedSession?.isPaused).toBe(false);
      
      jest.useRealTimers();
    });
  });

  describe('reconnection', () => {
    it('handles user reconnection', () => {
      const session = manager.createSession('Test Session', mockUser);
      const sessionId = session.id;
      
      // Simulate disconnection
      mockUser.isConnected = false;
      
      const reconnectedSession = manager.reconnectUser(sessionId, mockUser.id);
      expect(reconnectedSession?.users.get(mockUser.id)?.isConnected).toBe(true);
    });

    it('resumes session when Scrum Master reconnects', () => {
      const session = manager.createSession('Test Session', mockUser);
      const sessionId = session.id;
      
      const user2 = { ...mockUser, id: 'user-2', isScrumMaster: false };
      manager.joinSession(sessionId, user2);
      
      // Scrum Master disconnects
      manager.removeUserFromSession(sessionId, mockUser.id);
      const updatedSession = manager.getSession(sessionId);
      expect(updatedSession?.isPaused).toBe(true);
      
      // Re-add Scrum Master to session
      manager.joinSession(sessionId, mockUser);
      
      // Scrum Master reconnects
      const reconnectedSession = manager.reconnectUser(sessionId, mockUser.id);
      expect(reconnectedSession?.isPaused).toBe(false);
      expect(reconnectedSession?.scrumMasterDisconnectedAt).toBeUndefined();
    });
  });

  describe('getActiveSessions', () => {
    it('returns list of active sessions', () => {
      const user2 = { ...mockUser, id: 'user-2' };
      const user3 = { ...mockUser, id: 'user-3' };
      
      manager.createSession('Session 1', mockUser);
      manager.createSession('Session 2', user2);
      manager.createSession('Session 3', user3);
      
      const sessions = manager.getActiveSessions();
      
      expect(sessions.length).toBe(3);
      expect(sessions[0].name).toBe('Session 1');
      expect(sessions[1].name).toBe('Session 2');
      expect(sessions[2].name).toBe('Session 3');
      expect(sessions[0].userCount).toBe(1);
    });
  });
});