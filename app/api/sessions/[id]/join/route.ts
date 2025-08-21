import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session/SessionManager';
import { SessionUser } from '@/lib/types/user';

const sessionManager = SessionManager.getInstance();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await request.json();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User information is required' },
        { status: 400 }
      );
    }

    const sessionUser: SessionUser = {
      ...user,
      isConnected: true,
      hasVoted: false,
      isScrumMaster: false,
      joinedAt: new Date(),
      connectionId: `api-${Date.now()}`,
    };

    const { id } = await params;
    const session = sessionManager.joinSession(id, sessionUser);
    
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error joining session:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('full')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}