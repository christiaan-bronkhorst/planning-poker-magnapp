import { NextRequest } from 'next/server';
import { getSessionManager, getUserIdFromRequest, emitToSession, emitToAll } from '@/lib/api/middleware';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse, 
  unauthorizedResponse, 
  serverErrorResponse 
} from '@/lib/api/responses';
import { isValidGuid } from '@/lib/api/validators';

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

    return successResponse({
      id: session.id,
      name: session.name,
      scrumMasterId: session.scrumMasterId,
      users: Array.from(session.users.values()),
      currentRound: session.currentRound ? {
        id: session.currentRound.id,
        startedAt: session.currentRound.startedAt,
        isRevealed: session.currentRound.isRevealed,
        revealedAt: session.currentRound.revealedAt,
        voteCount: session.currentRound.votes.size,
      } : undefined,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      isPaused: session.isPaused,
      scrumMasterDisconnectedAt: session.scrumMasterDisconnectedAt,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return unauthorizedResponse('User ID required in x-user-id header');
    }
    
    if (!isValidGuid(sessionId)) {
      return errorResponse('Invalid session ID format');
    }

    const sessionManager = getSessionManager();
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return notFoundResponse('Session');
    }
    
    if (session.scrumMasterId !== userId) {
      return unauthorizedResponse('Only the Scrum Master can end the session');
    }

    sessionManager.endSession(sessionId);
    
    // Notify all clients in the session
    emitToSession(sessionId, 'sessionEnded', 'Session ended by Scrum Master');
    
    // Update active sessions list for all clients
    emitToAll('activeSessions', sessionManager.getActiveSessions());
    
    return successResponse({ message: 'Session ended successfully' });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return unauthorizedResponse('User ID required in x-user-id header');
    }
    
    if (!isValidGuid(sessionId)) {
      return errorResponse('Invalid session ID format');
    }

    const sessionManager = getSessionManager();
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return notFoundResponse('Session');
    }
    
    if (session.scrumMasterId !== userId) {
      return unauthorizedResponse('Only the Scrum Master can update the session');
    }

    const body = await request.json();
    
    // Currently only support updating the session name
    if (body.name && typeof body.name === 'string') {
      session.name = body.name.trim();
      
      // Notify all clients in the session
      emitToSession(sessionId, 'sessionUpdated', session);
      
      return successResponse({
        id: session.id,
        name: session.name,
        updatedAt: new Date(),
      });
    }
    
    return errorResponse('Invalid update data');
  } catch (error) {
    return serverErrorResponse(error);
  }
}