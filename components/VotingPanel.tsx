'use client';

import { useState, useEffect } from 'react';
import { VoteValue } from '@/lib/types/vote';
import { VOTE_CARDS } from '@/lib/constants';

interface VotingPanelProps {
  isVotingActive: boolean;
  hasVoted: boolean;
  isRevealed: boolean;
  onSubmitVote: (value: VoteValue) => void;
  currentVote?: VoteValue;
}

export default function VotingPanel({
  isVotingActive,
  hasVoted,
  isRevealed,
  onSubmitVote,
  currentVote,
}: VotingPanelProps) {
  const [selectedCard, setSelectedCard] = useState<VoteValue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isVotingActive || isRevealed) {
      setSelectedCard(null);
      setIsSubmitting(false);
    }
  }, [isVotingActive, isRevealed]);

  const handleCardSelect = (value: VoteValue) => {
    if (!isVotingActive || hasVoted || isRevealed) return;
    
    if (selectedCard === value) {
      setSelectedCard(null);
    } else {
      setSelectedCard(value);
    }
  };

  const handleSubmitVote = () => {
    if (!selectedCard || hasVoted || !isVotingActive) return;
    
    setIsSubmitting(true);
    onSubmitVote(selectedCard);
    
    // Keep the card selected after submission to show what was voted
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  const getCardStyle = (value: VoteValue) => {
    const baseStyle = "relative w-20 h-28 rounded-lg shadow-lg cursor-pointer transition-all duration-200 flex items-center justify-center font-bold text-2xl";
    
    if (!isVotingActive) {
      return `${baseStyle} bg-gray-200 text-gray-400 cursor-not-allowed opacity-50`;
    }
    
    if (hasVoted && currentVote === value) {
      return `${baseStyle} bg-green-500 text-white transform -translate-y-2 scale-105 ring-2 ring-green-600`;
    }
    
    if (selectedCard === value) {
      return `${baseStyle} bg-blue-500 text-white transform -translate-y-2 scale-105 ring-2 ring-blue-600`;
    }
    
    if (value === 'coffee') {
      return `${baseStyle} bg-yellow-50 text-yellow-800 hover:bg-yellow-100 hover:transform hover:-translate-y-1`;
    }
    
    return `${baseStyle} bg-white text-gray-800 hover:bg-gray-50 hover:transform hover:-translate-y-1`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          {!isVotingActive ? 'Waiting for voting to start...' :
           hasVoted ? 'Vote Submitted' :
           'Select Your Estimate'}
        </h3>
        {isVotingActive && !hasVoted && (
          <span className="text-sm text-gray-500">
            Click a card to select
          </span>
        )}
      </div>

      {/* Vote Cards */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        {VOTE_CARDS.map((value) => (
          <button
            key={value}
            onClick={() => handleCardSelect(value)}
            disabled={!isVotingActive || hasVoted || isRevealed}
            className={getCardStyle(value)}
          >
            {value === 'coffee' ? '☕' : value}
            {value !== 'coffee' && (
              <span className="absolute top-1 left-1 text-xs opacity-50">
                {value}
              </span>
            )}
            {value !== 'coffee' && (
              <span className="absolute bottom-1 right-1 text-xs opacity-50">
                {value}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      {isVotingActive && !hasVoted && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmitVote}
            disabled={!selectedCard || isSubmitting}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              selectedCard && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Vote'}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {hasVoted && !isRevealed && (
        <div className="text-center">
          <p className="text-green-600 font-medium">
            ✓ Your vote has been submitted
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Waiting for others to vote...
          </p>
        </div>
      )}

      {isRevealed && (
        <div className="text-center">
          <p className="text-blue-600 font-medium">
            Votes have been revealed
          </p>
        </div>
      )}

      {/* Voting Guide */}
      {isVotingActive && !hasVoted && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Fibonacci Sequence Guide:
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• <strong>1-3:</strong> Simple tasks, minimal effort</p>
            <p>• <strong>5-8:</strong> Moderate complexity, standard effort</p>
            <p>• <strong>13-21:</strong> Complex tasks, significant effort</p>
            <p>• <strong>☕:</strong> Need a break or more information</p>
          </div>
        </div>
      )}
    </div>
  );
}