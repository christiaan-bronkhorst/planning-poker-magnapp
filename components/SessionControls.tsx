'use client';

import { useState } from 'react';
import { Session, VotingRound } from '@/lib/types/session';

interface SessionControlsProps {
  session: Session;
  votingRound: VotingRound | null;
  votingStatus: Map<string, boolean>;
  isScrumMaster: boolean;
  onStartVoting: () => void;
  onRevealVotes: () => void;
  onStartNewRound: () => void;
  onEndSession: () => void;
}

export default function SessionControls({
  session,
  votingRound,
  votingStatus,
  isScrumMaster,
  onStartVoting,
  onRevealVotes,
  onStartNewRound,
  onEndSession,
}: SessionControlsProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  if (!isScrumMaster) {
    return null;
  }

  const allVoted = session.users.size > 0 && 
    Array.from(session.users.keys()).every(userId => votingStatus.get(userId));
  
  const hasVotes = votingRound && votingRound.votes.size > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Scrum Master Controls
      </h3>

      <div className="space-y-3">
        {/* Voting Controls */}
        {!votingRound && (
          <button
            onClick={onStartVoting}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Start Voting Round
          </button>
        )}

        {votingRound && !votingRound.isRevealed && (
          <>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Voting in progress: {votingStatus.size}/{session.users.size} voted
              </p>
              <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ 
                    width: `${(votingStatus.size / session.users.size) * 100}%` 
                  }}
                />
              </div>
            </div>

            <button
              onClick={onRevealVotes}
              disabled={!hasVotes}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                hasVotes
                  ? allVoted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {hasVotes
                ? allVoted
                  ? 'Reveal All Votes'
                  : `Reveal Votes (${votingStatus.size}/${session.users.size})`
                : 'Waiting for votes...'}
            </button>

            {hasVotes && !allVoted && (
              <p className="text-sm text-yellow-600 text-center">
                ⚠️ Not everyone has voted yet
              </p>
            )}
          </>
        )}

        {votingRound && votingRound.isRevealed && (
          <button
            onClick={onStartNewRound}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start New Round
          </button>
        )}

        {/* Session Info */}
        <div className="border-t pt-3 mt-4">
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Session ID:</span>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                {session.id}
              </code>
            </p>
            <p>
              <span className="font-medium">Participants:</span>
              <span className="ml-2">{session.users.size}</span>
            </p>
            <p>
              <span className="font-medium">Created:</span>
              <span className="ml-2">
                {new Date(session.createdAt).toLocaleTimeString()}
              </span>
            </p>
          </div>
        </div>

        {/* End Session */}
        <div className="border-t pt-3 mt-4">
          {!showEndConfirm ? (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              End Session
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600 text-center">
                Are you sure? This will end the session for everyone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onEndSession();
                    setShowEndConfirm(false);
                  }}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Yes, End Session
                </button>
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
          Quick Actions
        </summary>
        <div className="mt-3 space-y-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(session.id);
            }}
            className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            📋 Copy Session ID
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            🔗 Copy Session Link
          </button>
        </div>
      </details>
    </div>
  );
}