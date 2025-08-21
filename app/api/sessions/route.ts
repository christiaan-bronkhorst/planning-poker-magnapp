import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session/SessionManager';
import { SessionUser } from '@/lib/types/user';

const sessionManager = SessionManager.getInstance();

export async function GET() {
  try {
    const sessions = sessionManager.getActiveSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, user } = await request.json();

    if (!name || !user) {
      return NextResponse.json(
        { error: 'Session name and user information are required' },
        { status: 400 }
      );
    }

    const sessionUser: SessionUser = {
      ...user,
      isConnected: true,
      hasVoted: false,
      isScrumMaster: true,
      joinedAt: new Date(),
      connectionId: `api-${Date.now()}`,
    };

    const session = sessionManager.createSession(name, sessionUser);
    
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Maximum number of sessions')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}