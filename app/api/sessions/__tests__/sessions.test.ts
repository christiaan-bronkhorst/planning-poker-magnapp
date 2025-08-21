import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getSessionManager } from '@/lib/api/middleware';

// Mock the middleware
jest.mock('@/lib/api/middleware', () => ({
  getSessionManager: jest.fn(),
  emitToAll: jest.fn(),
  emitToSession: jest.fn(),
  getUserIdFromRequest: jest.fn(),
}));

describe('/api/sessions', () => {
  let mockSessionManager: any;

  beforeEach(() => {
    mockSessionManager = {
      getActiveSessions: jest.fn(),
      createSession: jest.fn(),
    };
    (getSessionManager as jest.Mock).mockReturnValue(mockSessionManager);
  });

  describe('GET /api/sessions', () => {
    it('should return list of active sessions', async () => {
      const mockSessions = [
        { id: 'session-1', name: 'Sprint Planning', userCount: 5, createdAt: new Date() },
        { id: 'session-2', name: 'Backlog Refinement', userCount: 3, createdAt: new Date() },
      ];
      mockSessionManager.getActiveSessions.mockReturnValue(mockSessions);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSessions);
    });

    it('should return empty array when no sessions exist', async () => {
      mockSessionManager.getActiveSessions.mockReturnValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });

  describe('POST /api/sessions', () => {
    it('should create a new session with valid data', async () => {
      const mockSession = {
        id: 'new-session-id',
        name: 'Sprint Planning',
        scrumMasterId: 'user-1',
        users: new Map([['user-1', { id: 'user-1', name: 'John Doe' }]]),
        createdAt: new Date(),
        isPaused: false,
      };
      mockSessionManager.createSession.mockReturnValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Sprint Planning',
          user: {
            id: 'user-1',
            name: 'John Doe',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('new-session-id');
      expect(data.data.name).toBe('Sprint Planning');
      expect(data.data.scrumMasterId).toBe('user-1');
    });

    it('should return error with invalid request data', async () => {
      const request = new NextRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          name: '',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid request data');
    });

    it('should return conflict when max sessions reached', async () => {
      mockSessionManager.createSession.mockImplementation(() => {
        throw new Error('Maximum number of concurrent sessions (3) reached');
      });

      const request = new NextRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Sprint Planning',
          user: {
            id: 'user-1',
            name: 'John Doe',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Maximum number of concurrent sessions');
    });

    it('should validate user name is not empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Sprint Planning',
          user: {
            id: 'user-1',
            name: '',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle optional avatar field', async () => {
      const mockSession = {
        id: 'new-session-id',
        name: 'Sprint Planning',
        scrumMasterId: 'user-1',
        users: new Map([['user-1', { 
          id: 'user-1', 
          name: 'John Doe',
          avatar: 'https://example.com/avatar.png',
        }]]),
        createdAt: new Date(),
        isPaused: false,
      };
      mockSessionManager.createSession.mockReturnValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Sprint Planning',
          user: {
            id: 'user-1',
            name: 'John Doe',
            avatar: 'https://example.com/avatar.png',
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });
});