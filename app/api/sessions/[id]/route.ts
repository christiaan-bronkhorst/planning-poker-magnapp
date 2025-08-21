import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session/SessionManager';

const sessionManager = SessionManager.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = sessionManager.getSession(id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const session = sessionManager.getSession(id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.scrumMasterId !== userId) {
      return NextResponse.json(
        { error: 'Only the Scrum Master can end the session' },
        { status: 403 }
      );
    }

    sessionManager.endSession(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}