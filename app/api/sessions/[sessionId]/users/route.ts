import { NextRequest } from 'next/server';
import { getSessionManager, emitToSession } from '@/lib/api/middleware';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse, 
  serverErrorResponse,
  conflictResponse 
} from '@/lib/api/responses';
import { validateJoinSession, isValidGuid } from '@/lib/api/validators';
import { SessionUser } from '@/lib/types/user';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    if (!isValidGuid(sessionId)) {
      return errorResponse('Invalid session ID format');
    }

    const sessionManager = getSessionManager();
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return notFoundResponse('Session');
    }

    const users = Array.from(session.users.values()).map(user => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      isConnected: user.isConnected,
      hasVoted: user.hasVoted,
      isScrumMaster: user.isScrumMaster,
      joinedAt: user.joinedAt,
    }));

    return successResponse(users);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    if (!isValidGuid(sessionId)) {
      return errorResponse('Invalid session ID format');
    }

    const body = await request.json();
    const validatedData = validateJoinSession(body);
    
    if (!validatedData) {
      return errorResponse('Invalid request data. User details are required.');
    }

    const sessionManager = getSessionManager();
    
    const sessionUser: SessionUser = {
      id: validatedData.user.id,
      name: validatedData.user.name,
      avatar: validatedData.user.avatar || '',
      isConnected: true,
      hasVoted: false,
      isScrumMaster: false,
      joinedAt: new Date(),
      connectionId: `api-${validatedData.user.id}`,
    };

    try {
      const session = sessionManager.joinSession(sessionId, sessionUser);
      
      // Notify all clients in the session
      emitToSession(sessionId, 'userJoined', sessionUser);
      emitToSession(sessionId, 'sessionUpdated', session);
      
      return successResponse({
        session: {
          id: session.id,
          name: session.name,
          scrumMasterId: session.scrumMasterId,
          users: Array.from(session.users.values()),
          currentRound: session.currentRound,
          isPaused: session.isPaused,
        },
        user: sessionUser,
      }, 201);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Session not found')) {
          return notFoundResponse('Session');
        }
        if (error.message.includes('Session is full')) {
          return conflictResponse(error.message);
        }
      }
      throw error;
    }
  } catch (error) {
    return serverErrorResponse(error);
  }
}