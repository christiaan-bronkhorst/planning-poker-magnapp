import { NextRequest } from 'next/server';
import { getSessionManager, emitToSession, emitToAll, getUserIdFromRequest } from '@/lib/api/middleware';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  unauthorizedResponse,
  serverErrorResponse 
} from '@/lib/api/responses';
import { isValidGuid } from '@/lib/api/validators';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; userId: string }> }
) {
  try {
    const { sessionId, userId: targetUserId } = await params;
    const requestingUserId = getUserIdFromRequest(request);
    
    if (!isValidGuid(sessionId)) {
      return errorResponse('Invalid session ID format');
    }

    const sessionManager = getSessionManager();
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return notFoundResponse('Session');
    }

    // Check if user is kicking someone else (must be Scrum Master)
    if (requestingUserId && requestingUserId !== targetUserId) {
      if (session.scrumMasterId !== requestingUserId) {
        return unauthorizedResponse('Only the Scrum Master can remove other users');
      }
    }

    const targetUser = session.users.get(targetUserId);
    if (!targetUser) {
      return notFoundResponse('User');
    }

    const updatedSession = sessionManager.removeUserFromSession(sessionId, targetUserId);
    
    if (updatedSession) {
      // Notify all clients in the session
      emitToSession(sessionId, 'userLeft', targetUserId);
      emitToSession(sessionId, 'sessionUpdated', updatedSession);
      
      // If Scrum Master role was transferred
      if (updatedSession.scrumMasterId !== session.scrumMasterId) {
        emitToSession(sessionId, 'scrumMasterChanged', updatedSession.scrumMasterId);
      }
    }
    
    // Update active sessions list
    emitToAll('activeSessions', sessionManager.getActiveSessions());
    
    return successResponse({
      message: 'User removed from session',
      sessionActive: updatedSession !== null,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; userId: string }> }
) {
  try {
    const { sessionId, userId } = await params;
    
    if (!isValidGuid(sessionId)) {
      return errorResponse('Invalid session ID format');
    }

    const sessionManager = getSessionManager();
    const session = sessionManager.reconnectUser(sessionId, userId);
    
    if (!session) {
      return notFoundResponse('Session or user');
    }

    // Notify all clients in the session
    emitToSession(sessionId, 'userReconnected', userId);
    emitToSession(sessionId, 'sessionUpdated', session);
    
    // If Scrum Master reconnected and session was paused
    if (session.scrumMasterId === userId && !session.isPaused) {
      emitToSession(sessionId, 'sessionResumed');
    }
    
    return successResponse({
      session: {
        id: session.id,
        name: session.name,
        scrumMasterId: session.scrumMasterId,
        users: Array.from(session.users.values()),
        currentRound: session.currentRound,
        isPaused: session.isPaused,
      },
      reconnected: true,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}