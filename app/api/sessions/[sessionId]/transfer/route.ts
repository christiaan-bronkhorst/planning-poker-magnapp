import { NextRequest } from 'next/server';
import { getSessionManager, emitToSession, getUserIdFromRequest } from '@/lib/api/middleware';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  unauthorizedResponse,
  serverErrorResponse 
} from '@/lib/api/responses';
import { validateTransferScrumMaster, isValidGuid } from '@/lib/api/validators';

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

    const body = await request.json();
    const validatedData = validateTransferScrumMaster(body);
    
    if (!validatedData) {
      return errorResponse('Invalid request data. New Scrum Master ID is required.');
    }

    const sessionManager = getSessionManager();
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return notFoundResponse('Session');
    }
    
    if (session.scrumMasterId !== userId) {
      return unauthorizedResponse('Only the current Scrum Master can transfer the role');
    }

    const newScrumMaster = session.users.get(validatedData.newScrumMasterId);
    if (!newScrumMaster) {
      return notFoundResponse('Target user not found in session');
    }

    if (validatedData.newScrumMasterId === userId) {
      return errorResponse('Cannot transfer role to yourself');
    }

    // Transfer the role
    const currentScrumMaster = session.users.get(userId);
    if (currentScrumMaster) {
      currentScrumMaster.isScrumMaster = false;
    }

    newScrumMaster.isScrumMaster = true;
    session.scrumMasterId = validatedData.newScrumMasterId;

    // Notify all clients in the session
    emitToSession(sessionId, 'scrumMasterChanged', validatedData.newScrumMasterId);
    emitToSession(sessionId, 'sessionUpdated', session);

    return successResponse({
      previousScrumMasterId: userId,
      newScrumMasterId: validatedData.newScrumMasterId,
      newScrumMasterName: newScrumMaster.name,
      transferredAt: new Date(),
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}