'use client';

import { useState } from 'react';
import { VoteCard } from './VoteCard';
import { VOTE_CARDS } from '@/lib/constants';
import { VoteValue } from '@/lib/types/vote';
import { useSessionStore } from '@/lib/store/sessionStore';
import { useUserStore } from '@/lib/store/userStore';

interface VotingPanelProps {
  onVote?: (value: VoteValue) => void;
  disabled?: boolean;
}

export const VotingPanel = ({ onVote, disabled = false }: VotingPanelProps) => {
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const { currentSession } = useSessionStore();
  const { id: userId } = useUserStore();

  const currentUser = currentSession?.users.get(userId);
  const hasVoted = currentUser?.hasVoted || false;
  const votingInProgress = currentSession?.currentRound && !currentSession.currentRound.isRevealed;

  const handleVoteSelect = (value: VoteValue) => {
    if (disabled || hasVoted || !votingInProgress) return;
    
    setSelectedVote(value);
    onVote?.(value);
  };

  const getVotingStatus = () => {
    if (!votingInProgress) {
      return { message: 'Waiting for voting to start...', color: 'text-gray-600' };
    }
    
    if (hasVoted) {
      return { message: 'Vote submitted! Waiting for others...', color: 'text-green-600' };
    }
    
    return { message: 'Select your estimate', color: 'text-blue-600' };
  };

  const status = getVotingStatus();
  const isVotingDisabled = disabled || hasVoted || !votingInProgress;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Status message */}
      <div className="text-center mb-6">
        <p className={`text-lg font-medium ${status.color}`}>
          {status.message}
        </p>
      </div>

      {/* Vote cards grid */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 justify-items-center">
        {VOTE_CARDS.map((value) => (
          <VoteCard
            key={value}
            value={value}
            isSelected={selectedVote === value}
            isDisabled={isVotingDisabled}
            onClick={handleVoteSelect}
          />
        ))}
      </div>

      {/* Voting instructions */}
      {votingInProgress && !hasVoted && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Choose a Fibonacci number (1, 2, 3, 5, 8, 13, 21) or ☕ if you need a break
          </p>
        </div>
      )}

      {/* Vote count indicator */}
      {votingInProgress && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
            <div className="flex gap-1">
              {Array.from(currentSession?.users.values() || []).map((user) => (
                <div
                  key={user.id}
                  className={`w-3 h-3 rounded-full ${
                    user.hasVoted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  title={`${user.name}${user.hasVoted ? ' (voted)' : ' (not voted)'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {Array.from(currentSession?.users.values() || []).filter(u => u.hasVoted).length} / {currentSession?.users.size || 0} voted
            </span>
          </div>
        </div>
      )}
    </div>
  );
};