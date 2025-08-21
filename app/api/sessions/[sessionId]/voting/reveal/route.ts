import { NextRequest } from 'next/server';
import { getSessionManager, emitToSession, getUserIdFromRequest } from '@/lib/api/middleware';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  unauthorizedResponse,
  serverErrorResponse 
} from '@/lib/api/responses';
import { isValidGuid } from '@/lib/api/validators';
import { MESSAGES } from '@/lib/constants';

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
      return unauthorizedResponse('Only the Scrum Master can reveal votes');
    }

    try {
      const { votes, statistics } = sessionManager.revealVotes(sessionId);
      
      // Transform votes for client
      const voteData = votes.map(v => ({ 
        userId: v.userId, 
        value: v.value,
        submittedAt: v.submittedAt,
      }));
      
      // Notify all clients in the session
      emitToSession(sessionId, 'votesRevealed', voteData, statistics);
      
      return successResponse({
        votes: voteData,
        statistics: {
          average: statistics.average,
          distribution: Array.from(statistics.distribution.entries()).map(([value, count]) => ({
            value,
            count,
          })),
          hasConsensus: statistics.hasConsensus,
          totalVotes: statistics.totalVotes,
          coffeeVotes: statistics.coffeeVotes,
        },
        revealedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof Error && error.message === MESSAGES.SESSION_NOT_FOUND) {
        return notFoundResponse('Session or voting round');
      }
      throw error;
    }
  } catch (error) {
    return serverErrorResponse(error);
  }
}