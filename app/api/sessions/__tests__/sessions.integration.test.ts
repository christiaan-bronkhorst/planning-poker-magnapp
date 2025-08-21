/**
 * @jest-environment node
 */
import { GET, POST } from '../route';
import { createMockRequest, parseResponse } from '@/lib/api/__tests__/test-utils';
import { resetSessionManager } from '@/lib/api/middleware';

beforeEach(() => {
  // Reset the session manager singleton before each test
  resetSessionManager();
});

describe('Sessions API Integration Tests', () => {
  describe('GET /api/sessions', () => {
    it('should return empty array initially', async () => {
      const response = await GET();
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should return sessions after creation', async () => {
      // Create a session first
      const createRequest = createMockRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: {
          name: 'Sprint Planning',
          user: {
            id: 'user-1',
            name: 'John Doe',
          },
        },
      });

      await POST(createRequest);

      // Now get the sessions
      const response = await GET();
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Sprint Planning');
      expect(data.data[0].userCount).toBe(1);
    });
  });

  describe('POST /api/sessions', () => {
    it('should create a new session successfully', async () => {
      const request = createMockRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: {
          name: 'Sprint Planning',
          user: {
            id: 'user-1',
            name: 'John Doe',
            avatar: 'https://example.com/avatar.png',
          },
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Sprint Planning');
      expect(data.data.scrumMasterId).toBe('user-1');
      expect(data.data.users).toHaveLength(1);
      expect(data.data.users[0].id).toBe('user-1');
      expect(data.data.users[0].isScrumMaster).toBe(true);
    });

    it('should enforce maximum concurrent sessions limit', async () => {
      // Create 3 sessions (the maximum)
      for (let i = 1; i <= 3; i++) {
        const request = createMockRequest('http://localhost:3000/api/sessions', {
          method: 'POST',
          body: {
            name: `Session ${i}`,
            user: {
              id: `user-${i}`,
              name: `User ${i}`,
            },
          },
        });
        const response = await POST(request);
        expect(response.status).toBe(201);
      }

      // Try to create a 4th session
      const request = createMockRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: {
          name: 'Session 4',
          user: {
            id: 'user-4',
            name: 'User 4',
          },
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Maximum number of concurrent sessions');
    });

    it('should validate required fields', async () => {
      const testCases = [
        {
          body: { name: '' },
          description: 'empty name',
        },
        {
          body: { name: 'Test', user: {} },
          description: 'missing user id',
        },
        {
          body: { name: 'Test', user: { id: 'test' } },
          description: 'missing user name',
        },
      ];

      for (const testCase of testCases) {
        const request = createMockRequest('http://localhost:3000/api/sessions', {
          method: 'POST',
          body: testCase.body,
        });

        const response = await POST(request);
        const data = await parseResponse(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Invalid request data');
      }
    });

    it('should trim whitespace from names', async () => {
      const request = createMockRequest('http://localhost:3000/api/sessions', {
        method: 'POST',
        body: {
          name: '  Sprint Planning  ',
          user: {
            id: 'user-1',
            name: '  John Doe  ',
          },
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.data.name).toBe('Sprint Planning');
      expect(data.data.users[0].name).toBe('John Doe');
    });
  });
});