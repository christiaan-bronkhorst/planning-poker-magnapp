'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SessionBoard } from '@/components/session/SessionBoard';
import { VotingPanel } from '@/components/voting/VotingPanel';
import { VoteResults } from '@/components/voting/VoteResults';
import { useSessionStore } from '@/lib/store/sessionStore';
import { useUserStore } from '@/lib/store/userStore';
import { useSocket } from '@/hooks/useSocket';
import { setupSocketHandlers, createSessionActions } from '@/lib/socket/handlers';
import { VoteValue, VoteStatistics } from '@/lib/types/vote';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const { socket, isConnected, connect } = useSocket();
  const { currentSession, isLoading, error } = useSessionStore();
  const { id: userId, name: userName } = useUserStore();
  
  const [voteData, setVoteData] = useState<{
    votes: Array<{ userId: string; value: VoteValue }>;
    statistics: VoteStatistics;
  } | null>(null);

  const currentUser = currentSession?.users.get(userId);
  const isCurrentUserScrumMaster = currentUser?.isScrumMaster || false;
  const votingInProgress = currentSession?.currentRound && !currentSession.currentRound.isRevealed;
  const votesRevealed = currentSession?.currentRound?.isRevealed;

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  useEffect(() => {
    if (socket && isConnected && sessionId) {
      const cleanup = setupSocketHandlers(socket);
      
      // Listen for votes revealed to update local state
      socket.on('votesRevealed', (votes, statistics) => {
        setVoteData({ votes, statistics });
      });
      
      // Try to reconnect to the session
      const actions = createSessionActions(socket);
      actions.reconnect(sessionId);
      
      return () => {
        cleanup();
        socket.off('votesRevealed');
      };
    }
  }, [socket, isConnected, sessionId]);

  useEffect(() => {
    // Redirect if no user name is set
    if (!userName) {
      router.push('/');
      return;
    }

    // Redirect if session ends or user is kicked
    if (!currentSession && !isLoading) {
      router.push('/');
    }
  }, [currentSession, isLoading, userName, router]);

  const handleVote = (value: VoteValue) => {
    if (!socket) return;
    const actions = createSessionActions(socket);
    actions.submitVote(value);
  };

  const handleStartVoting = () => {
    if (!socket || !isCurrentUserScrumMaster) return;
    const actions = createSessionActions(socket);
    actions.startVoting();
  };

  const handleRevealVotes = () => {
    if (!socket || !isCurrentUserScrumMaster) return;
    const actions = createSessionActions(socket);
    actions.revealVotes();
  };

  const handleStartNewRound = () => {
    if (!socket || !isCurrentUserScrumMaster) return;
    const actions = createSessionActions(socket);
    actions.startNewRound();
    setVoteData(null); // Clear previous results
  };

  const handleKickUser = (kickUserId: string) => {
    if (!socket || !isCurrentUserScrumMaster) return;
    const actions = createSessionActions(socket);
    actions.kickUser(kickUserId);
  };

  const handleTransferRole = (newScrumMasterId: string) => {
    if (!socket || !isCurrentUserScrumMaster) return;
    const actions = createSessionActions(socket);
    actions.transferScrumMaster(newScrumMasterId);
  };

  const handleEndSession = () => {
    if (!socket || !isCurrentUserScrumMaster) return;
    if (confirm('Are you sure you want to end this session?')) {
      const actions = createSessionActions(socket);
      actions.endSession();
    }
  };

  const handleLeaveSession = () => {
    if (!socket) return;
    if (confirm('Are you sure you want to leave this session?')) {
      const actions = createSessionActions(socket);
      actions.leaveSession();
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-6">This session may have ended or does not exist.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{currentSession.name}</h1>
              <p className="text-gray-600">
                {Array.from(currentSession.users.values()).length} participant
                {currentSession.users.size !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Scrum Master controls */}
              {isCurrentUserScrumMaster && (
                <>
                  {!votingInProgress && !votesRevealed && (
                    <button
                      onClick={handleStartVoting}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    >
                      Start Voting
                    </button>
                  )}
                  
                  {votingInProgress && (
                    <button
                      onClick={handleRevealVotes}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Reveal Votes
                    </button>
                  )}
                  
                  {votesRevealed && (
                    <button
                      onClick={handleStartNewRound}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                    >
                      New Round
                    </button>
                  )}
                  
                  <button
                    onClick={handleEndSession}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    End Session
                  </button>
                </>
              )}
              
              <button
                onClick={handleLeaveSession}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Leave
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Boardroom */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 h-[500px]">
              <SessionBoard
                onKickUser={handleKickUser}
                onTransferRole={handleTransferRole}
                showControls={isCurrentUserScrumMaster}
              />
            </div>
          </div>

          {/* Voting panel / Results */}
          <div className="space-y-6">
            {votesRevealed && voteData ? (
              <VoteResults
                votes={voteData.votes}
                statistics={voteData.statistics}
                users={currentSession.users}
                onStartNewRound={isCurrentUserScrumMaster ? handleStartNewRound : undefined}
                showNewRoundButton={isCurrentUserScrumMaster}
              />
            ) : (
              <VotingPanel onVote={handleVote} />
            )}
          </div>
        </div>

        {/* Session info */}
        <div className="bg-white rounded-lg shadow-sm p-4 text-center text-sm text-gray-600">
          Session ID: <code className="bg-gray-100 px-2 py-1 rounded">{currentSession.id}</code>
        </div>
      </div>
    </div>
  );
}