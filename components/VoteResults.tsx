'use client';

import { VoteValue, VoteStatistics } from '@/lib/types/vote';
import { SessionUser } from '@/lib/types/user';
import { Session } from '@/lib/types/session';

interface VoteResultsProps {
  session: Session;
  statistics: VoteStatistics | null;
  isRevealed: boolean;
}

export default function VoteResults({
  session,
  statistics,
  isRevealed,
}: VoteResultsProps) {
  if (!isRevealed || !statistics || !session.currentRound) {
    return null;
  }

  const votes = Array.from(session.currentRound.votes.entries());
  const votesByValue = new Map<VoteValue, SessionUser[]>();
  
  votes.forEach(([userId, vote]) => {
    const user = session.users.get(userId);
    if (user) {
      if (!votesByValue.has(vote.value)) {
        votesByValue.set(vote.value, []);
      }
      votesByValue.get(vote.value)!.push(user);
    }
  });

  const sortedValues = Array.from(votesByValue.keys()).sort((a, b) => {
    if (a === 'coffee') return 1;
    if (b === 'coffee') return -1;
    return Number(a) - Number(b);
  });

  const getConsensusMessage = () => {
    if (statistics.hasConsensus) {
      return '🎉 Perfect consensus!';
    }
    
    const uniqueValues = sortedValues.filter(v => v !== 'coffee').length;
    if (uniqueValues === 1) {
      return statistics.coffeeVotes > 0 
        ? '☕ Consensus except for coffee breaks' 
        : '🎉 Perfect consensus!';
    }
    
    if (uniqueValues === 2) {
      return '📊 Close agreement';
    }
    
    return '🔄 Wide spread - discussion needed';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Voting Results
      </h3>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            {statistics.average !== null ? statistics.average.toFixed(1) : 'N/A'}
          </p>
          <p className="text-sm text-gray-600">Average</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {statistics.totalVotes}
          </p>
          <p className="text-sm text-gray-600">Total Votes</p>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">
            {sortedValues.filter(v => v !== 'coffee').length}
          </p>
          <p className="text-sm text-gray-600">Unique Values</p>
        </div>
        
        {statistics.coffeeVotes > 0 && (
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {statistics.coffeeVotes}
            </p>
            <p className="text-sm text-gray-600">Coffee Breaks</p>
          </div>
        )}
      </div>

      {/* Consensus Status */}
      <div className={`p-4 rounded-lg mb-6 text-center ${
        statistics.hasConsensus 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        <p className="font-semibold">{getConsensusMessage()}</p>
      </div>

      {/* Vote Distribution */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Vote Distribution:</h4>
        {sortedValues.map((value) => {
          const users = votesByValue.get(value)!;
          const percentage = (users.length / statistics.totalVotes) * 100;
          
          return (
            <div key={value} className="flex items-center gap-3">
              <div className={`w-16 text-center py-1 px-2 rounded font-bold ${
                value === 'coffee' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {value === 'coffee' ? '☕' : value}
              </div>
              
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      value === 'coffee' ? 'bg-yellow-400' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                    {users.length} vote{users.length !== 1 ? 's' : ''} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex -space-x-2">
                {users.slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-sm"
                    title={user.name}
                  >
                    {user.avatar}
                  </div>
                ))}
                {users.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                    +{users.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Votes */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
          Show all votes
        </summary>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {votes.map(([userId, vote]) => {
            const user = session.users.get(userId);
            if (!user) return null;
            
            return (
              <div
                key={userId}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <span className="text-lg">{user.avatar}</span>
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {user.name}
                </span>
                <span className={`font-bold ${
                  vote.value === 'coffee' 
                    ? 'text-yellow-600' 
                    : 'text-blue-600'
                }`}>
                  {vote.value === 'coffee' ? '☕' : vote.value}
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}