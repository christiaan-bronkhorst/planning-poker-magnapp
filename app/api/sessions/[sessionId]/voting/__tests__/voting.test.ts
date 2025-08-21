/**
 * @jest-environment node
 */
import { GET, POST, PATCH } from '../route';
import { POST as revealPOST } from '../reveal/route';
import { createMockRequest, parseResponse } from '@/lib/api/__tests__/test-utils';
import { getSessionManager, resetSessionManager } from '@/lib/api/middleware';
import { SessionUser } from '@/lib/types/user';

describe('Voting API Tests', () => {
  let sessionId: string;
  let scrumMasterId: string;
  let participantId: string;

  beforeEach(() => {
    resetSessionManager();
    
    // Create a session with users for testing
    const sessionManager = getSessionManager();
    scrumMasterId = 'scrum-master-1';
    participantId = 'participant-1';
    
    const scrumMaster: SessionUser = {
      id: scrumMasterId,
      name: 'Scrum Master',
      avatar: '',
      isConnected: true,
      hasVoted: false,
      isScrumMaster: true,
      joinedAt: new Date(),
      connectionId: 'conn-1',
    };
    
    const participant: SessionUser = {
      id: participantId,
      name: 'Participant',
      avatar: '',
      isConnected: true,
      hasVoted: false,
      isScrumMaster: false,
      joinedAt: new Date(),
      connectionId: 'conn-2',
    };
    
    const session = sessionManager.createSession('Test Session', scrumMaster);
    sessionId = session.id;
    sessionManager.joinSession(sessionId, participant);
  });

  describe('GET /api/sessions/[sessionId]/voting', () => {
    it('should return no active round initially', async () => {
      const response = await GET(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting`),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.active).toBe(false);
      expect(data.data.message).toBe('No voting round in progress');
    });

    it('should return voting status when round is active', async () => {
      // Start a voting round first
      const sessionManager = getSessionManager();
      sessionManager.startVotingRound(sessionId);

      const response = await GET(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting`),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.active).toBe(true);
      expect(data.data.round).toBeDefined();
      expect(data.data.round.isRevealed).toBe(false);
      expect(data.data.votingStatus).toHaveLength(2);
    });
  });

  describe('POST /api/sessions/[sessionId]/voting', () => {
    it('should start voting round as Scrum Master', async () => {
      const response = await POST(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting`, {
          method: 'POST',
          headers: { 'x-user-id': scrumMasterId },
        }),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.round).toBeDefined();
      expect(data.data.round.isRevealed).toBe(false);
      expect(data.data.message).toBe('Voting round started');
    });

    it('should reject voting start from non-Scrum Master', async () => {
      const response = await POST(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting`, {
          method: 'POST',
          headers: { 'x-user-id': participantId },
        }),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Only the Scrum Master can start voting');
    });

    it('should require user ID header', async () => {
      const response = await POST(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting`, {
          method: 'POST',
        }),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('User ID required');
    });
  });

  describe('PATCH /api/sessions/[sessionId]/voting', () => {
    beforeEach(() => {
      // Start a voting round for vote submission tests
      const sessionManager = getSessionManager();
      sessionManager.startVotingRound(sessionId);
    });

    it('should submit a valid vote', async () => {
      const response = await PATCH(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting`, {
          method: 'PATCH',
          headers: { 'x-user-id': participantId },
          body: { value: 5 },
        }),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.userId).toBe(participantId);
      expect(data.data.value).toBe(5);
    });

    it('should accept coffee vote', async () => {
      const response = await PATCH(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting`, {
          method: 'PATCH',
          headers: { 'x-user-id': participantId },
          body: { value: 'coffee' },
        }),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.value).toBe('coffee');
    });

    it('should reject invalid vote values', async () => {
      const response = await PATCH(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting`, {
          method: 'PATCH',
          headers: { 'x-user-id': participantId },
          body: { value: 4 }, // Not a Fibonacci number
        }),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid vote value');
    });

    it('should reject vote when no round is active', async () => {
      // End the current round
      const sessionManager = getSessionManager();
      sessionManager.revealVotes(sessionId);
      
      const response = await PATCH(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting`, {
          method: 'PATCH',
          headers: { 'x-user-id': participantId },
          body: { value: 5 },
        }),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('No voting round in progress');
    });
  });

  describe('POST /api/sessions/[sessionId]/voting/reveal', () => {
    beforeEach(() => {
      // Start a voting round and submit some votes
      const sessionManager = getSessionManager();
      sessionManager.startVotingRound(sessionId);
      sessionManager.submitVote(sessionId, scrumMasterId, 5);
      sessionManager.submitVote(sessionId, participantId, 8);
    });

    it('should reveal votes as Scrum Master', async () => {
      const response = await revealPOST(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting/reveal`, {
          method: 'POST',
          headers: { 'x-user-id': scrumMasterId },
        }),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.votes).toHaveLength(2);
      expect(data.data.statistics).toBeDefined();
      expect(data.data.statistics.average).toBe(6.5);
      expect(data.data.statistics.totalVotes).toBe(2);
      expect(data.data.statistics.hasConsensus).toBe(false);
    });

    it('should calculate consensus correctly', async () => {
      // Reset and create a scenario with consensus
      const sessionManager = getSessionManager();
      const session = sessionManager.getSession(sessionId)!;
      session.currentRound!.votes.clear();
      sessionManager.submitVote(sessionId, scrumMasterId, 5);
      sessionManager.submitVote(sessionId, participantId, 5);

      const response = await revealPOST(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting/reveal`, {
          method: 'POST',
          headers: { 'x-user-id': scrumMasterId },
        }),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.data.statistics.hasConsensus).toBe(true);
      expect(data.data.statistics.average).toBe(5);
    });

    it('should reject reveal from non-Scrum Master', async () => {
      const response = await revealPOST(
        createMockRequest(`http://localhost:3000/api/sessions/${sessionId}/voting/reveal`, {
          method: 'POST',
          headers: { 'x-user-id': participantId },
        }),
        { params: Promise.resolve({ sessionId }) }
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Only the Scrum Master can reveal votes');
    });
  });
});