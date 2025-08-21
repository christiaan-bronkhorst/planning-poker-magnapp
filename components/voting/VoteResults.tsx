'use client';

import { VoteValue, VoteStatistics } from '@/lib/types/vote';
import { SessionUser } from '@/lib/types/user';
import { VoteCard } from './VoteCard';

interface VoteResultsProps {
  votes: Array<{ userId: string; value: VoteValue }>;
  statistics: VoteStatistics;
  users: Map<string, SessionUser>;
  onStartNewRound?: () => void;
  showNewRoundButton?: boolean;
}

export const VoteResults = ({ 
  votes, 
  statistics, 
  users,
  onStartNewRound,
  showNewRoundButton = false 
}: VoteResultsProps) => {
  const getDistributionPercentage = (value: VoteValue) => {
    const count = statistics.distribution.get(value) || 0;
    return (count / statistics.totalVotes) * 100;
  };

  const getUsersForValue = (value: VoteValue) => {
    return votes
      .filter(vote => vote.value === value)
      .map(vote => users.get(vote.userId))
      .filter(Boolean) as SessionUser[];
  };

  const uniqueValues = Array.from(statistics.distribution.keys()).sort((a, b) => {
    if (a === 'coffee') return 1;
    if (b === 'coffee') return -1;
    return (a as number) - (b as number);
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Vote Results</h2>
        <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
          <span>Total Votes: {statistics.totalVotes}</span>
          {statistics.average && (
            <span>Average: {statistics.average.toFixed(1)}</span>
          )}
          {statistics.hasConsensus && (
            <span className="text-green-600 font-medium">✓ Consensus Reached</span>
          )}
        </div>
      </div>

      {/* Vote Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {uniqueValues.map((value) => {
          const usersWithThisVote = getUsersForValue(value);
          const percentage = getDistributionPercentage(value);
          
          return (
            <div key={value} className="bg-gray-50 rounded-lg p-4">
              {/* Vote card display */}
              <div className="flex justify-center mb-3">
                <VoteCard value={value} isDisabled className="scale-75" />
              </div>
              
              {/* Statistics */}
              <div className="text-center mb-3">
                <div className="text-lg font-semibold text-gray-800">
                  {statistics.distribution.get(value)} votes
                </div>
                <div className="text-sm text-gray-600">
                  {percentage.toFixed(0)}%
                </div>
              </div>
              
              {/* Users who voted this value */}
              <div className="space-y-1">
                {usersWithThisVote.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <span className="text-lg">{user.avatar}</span>
                    <span className="text-sm text-gray-700 truncate">
                      {user.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Consensus indicator */}
      {statistics.hasConsensus ? (
        <div className="bg-green-100 border border-green-400 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-600 text-xl">🎉</span>
            <span className="text-green-800 font-medium">
              Perfect consensus! Everyone voted {uniqueValues[0]}.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-blue-100 border border-blue-400 rounded-lg p-4 mb-6">
          <div className="text-center">
            <span className="text-blue-800 font-medium">
              Discussion recommended - votes range from{' '}
              {Math.min(...votes.filter(v => v.value !== 'coffee').map(v => v.value as number))} to{' '}
              {Math.max(...votes.filter(v => v.value !== 'coffee').map(v => v.value as number))}
            </span>
          </div>
        </div>
      )}

      {/* Coffee break indicator */}
      {statistics.coffeeVotes > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">☕</span>
            <span className="text-yellow-800 font-medium">
              {statistics.coffeeVotes} team member{statistics.coffeeVotes > 1 ? 's' : ''} requested a break
            </span>
          </div>
        </div>
      )}

      {/* Action button */}
      {showNewRoundButton && (
        <div className="text-center">
          <button
            onClick={onStartNewRound}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors duration-200"
          >
            Start New Round
          </button>
        </div>
      )}
    </div>
  );
};