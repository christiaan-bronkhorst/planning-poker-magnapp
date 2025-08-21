import { NextRequest } from 'next/server';
import { getSessionManager, emitToSession, getUserIdFromRequest } from '@/lib/api/middleware';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  unauthorizedResponse,
  serverErrorResponse 
} from '@/lib/api/responses';
import { validateSubmitVote, isValidGuid } from '@/lib/api/validators';
import { MESSAGES } from '@/lib/constants';

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

    if (!session.currentRound) {
      return successResponse({
        active: false,
        message: 'No voting round in progress',
      });
    }

    const votingStatus = Array.from(session.users.values()).map(user => ({
      userId: user.id,
      userName: user.name,
      hasVoted: user.hasVoted,
    }));

    return successResponse({
      active: true,
      round: {
        id: session.currentRound.id,
        startedAt: session.currentRound.startedAt,
        isRevealed: session.currentRound.isRevealed,
        revealedAt: session.currentRound.revealedAt,
        voteCount: session.currentRound.votes.size,
        totalUsers: session.users.size,
      },
      votingStatus,
    });
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
      return unauthorizedResponse('Only the Scrum Master can start voting');
    }

    try {
      const round = sessionManager.startVotingRound(sessionId);
      
      // Notify all clients in the session
      emitToSession(sessionId, 'votingStarted', round);
      
      return successResponse({
        round: {
          id: round.id,
          startedAt: round.startedAt,
          isRevealed: false,
        },
        message: 'Voting round started',
      }, 201);
    } catch (error) {
      if (error instanceof Error && error.message === MESSAGES.SESSION_NOT_FOUND) {
        return notFoundResponse('Session');
      }
      throw error;
    }
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

    const body = await request.json();
    const validatedData = validateSubmitVote(body);
    
    if (!validatedData) {
      return errorResponse('Invalid vote value. Must be a Fibonacci number (1, 2, 3, 5, 8, 13, 21) or "coffee"');
    }

    const sessionManager = getSessionManager();
    
    try {
      sessionManager.submitVote(sessionId, userId, validatedData.value);
      
      // Notify all clients in the session
      emitToSession(sessionId, 'voteSubmitted', userId);
      
      return successResponse({
        userId,
        value: validatedData.value,
        submittedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === MESSAGES.SESSION_NOT_FOUND) {
          return notFoundResponse('Session');
        }
        if (error.message === MESSAGES.VOTING_NOT_STARTED) {
          return errorResponse('No voting round in progress');
        }
        if (error.message === MESSAGES.INVALID_SESSION) {
          return unauthorizedResponse('User not in session');
        }
      }
      throw error;
    }
  } catch (error) {
    return serverErrorResponse(error);
  }
}