'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSession } from '@/hooks/useSession';
import VirtualBoardroom from '@/components/VirtualBoardroom';
import VotingPanel from '@/components/VotingPanel';
import VoteResults from '@/components/VoteResults';
import SessionControls from '@/components/SessionControls';
import { validateSessionId } from '@/utils/sessionHelpers';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const { userId, preferences, isLoaded } = useLocalStorage();
  const { connect, disconnect, isConnected } = useSocket();
  const [hasJoined, setHasJoined] = useState(false);
  
  const {
    session,
    isLoading,
    error,
    currentUser,
    isScrumMaster,
    votingRound,
    votingStatus,
    voteStatistics,
    startVoting,
    submitVote,
    revealVotes,
    startNewRound,
    endSession,
    kickUser,
    transferScrumMaster,
    leaveSession,
  } = useSession(sessionId, userId);

  // Validate session ID
  useEffect(() => {
    if (!validateSessionId(sessionId)) {
      router.push('/');
    }
  }, [sessionId, router]);

  // Connect to socket
  useEffect(() => {
    if (isLoaded) {
      connect();
    }
    return () => disconnect();
  }, [isLoaded, connect, disconnect]);

  // Auto-join session if not already in it
  useEffect(() => {
    if (isConnected && isLoaded && !hasJoined && !session) {
      const socket = getSocket();
      if (socket && preferences.name) {
        socket.emit('joinSession', sessionId, {
          id: userId,
          name: preferences.name,
          avatar: preferences.avatar,
        });
        setHasJoined(true);
      }
    }
  }, [isConnected, isLoaded, hasJoined, session, sessionId, userId, preferences]);

  // Handle loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-2xl mb-2">🔄</div>
          <p className="text-xl text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Handle no session state
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-2xl mb-2">🔍</div>
          <p className="text-xl text-gray-600">Joining session...</p>
        </div>
      </div>
    );
  }

  const currentVote = votingRound?.votes.get(userId)?.value;
  const hasVoted = votingStatus.get(userId) || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🎯 {session.name}</h1>
            <p className="text-gray-600">
              {currentUser?.name} {currentUser?.avatar} {isScrumMaster && '(Scrum Master)'}
            </p>
          </div>
          <button
            onClick={leaveSession}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Leave Session
          </button>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Session Paused Banner */}
        {session.isPaused && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
            Session is paused - waiting for Scrum Master to return
          </div>
        )}

        {/* Main Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Controls & Results */}
          <div className="space-y-6">
            <SessionControls
              session={session}
              votingRound={votingRound}
              votingStatus={votingStatus}
              isScrumMaster={isScrumMaster}
              onStartVoting={startVoting}
              onRevealVotes={revealVotes}
              onStartNewRound={startNewRound}
              onEndSession={endSession}
            />
            
            {votingRound?.isRevealed && (
              <VoteResults
                session={session}
                statistics={voteStatistics}
                isRevealed={votingRound.isRevealed}
              />
            )}
          </div>

          {/* Center Column - Boardroom */}
          <div className="lg:col-span-2 space-y-6">
            <VirtualBoardroom
              session={session}
              currentUserId={userId}
              votingRound={votingRound}
              votingStatus={votingStatus}
              isScrumMaster={isScrumMaster}
              onKickUser={kickUser}
              onTransferScrumMaster={transferScrumMaster}
            />
            
            <VotingPanel
              isVotingActive={!!votingRound && !votingRound.isRevealed}
              hasVoted={hasVoted}
              isRevealed={votingRound?.isRevealed || false}
              onSubmitVote={submitVote}
              currentVote={currentVote}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Import getSocket since it's used in the component
import { getSocket } from '@/lib/socket/client';