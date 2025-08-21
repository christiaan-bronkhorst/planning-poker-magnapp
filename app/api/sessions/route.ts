import { NextRequest } from 'next/server';
import { getSessionManager, emitToAll } from '@/lib/api/middleware';
import { successResponse, errorResponse, serverErrorResponse, conflictResponse } from '@/lib/api/responses';
import { validateCreateSession } from '@/lib/api/validators';
import { SessionUser } from '@/lib/types/user';

export async function GET() {
  try {
    const sessionManager = getSessionManager();
    const sessions = sessionManager.getActiveSessions();
    return successResponse(sessions);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateCreateSession(body);
    
    if (!validatedData) {
      return errorResponse('Invalid request data. Name and user details are required.');
    }

    const sessionManager = getSessionManager();
    
    const sessionUser: SessionUser = {
      id: validatedData.user.id,
      name: validatedData.user.name,
      avatar: validatedData.user.avatar || '',
      isConnected: true,
      hasVoted: false,
      isScrumMaster: true,
      joinedAt: new Date(),
      connectionId: `api-${validatedData.user.id}`,
    };

    try {
      const session = sessionManager.createSession(validatedData.name, sessionUser);
      
      // Emit to all clients that a new session was created
      emitToAll('activeSessions', sessionManager.getActiveSessions());
      
      return successResponse({
        id: session.id,
        name: session.name,
        scrumMasterId: session.scrumMasterId,
        users: Array.from(session.users.values()),
        currentRound: session.currentRound,
        createdAt: session.createdAt,
        isPaused: session.isPaused,
      }, 201);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Maximum number of concurrent sessions')) {
        return conflictResponse(error.message);
      }
      throw error;
    }
  } catch (error) {
    return serverErrorResponse(error);
  }
}