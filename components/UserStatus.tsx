'use client';

import { SessionUser } from '@/lib/types/user';
import { VoteValue } from '@/lib/types/vote';

interface UserStatusProps {
  user: SessionUser;
  hasVoted: boolean;
  vote?: VoteValue;
  isRevealed: boolean;
  isCurrentUser: boolean;
  onKick?: () => void;
  onTransferRole?: () => void;
  showControls?: boolean;
}

export default function UserStatus({
  user,
  hasVoted,
  vote,
  isRevealed,
  isCurrentUser,
  onKick,
  onTransferRole,
  showControls = false,
}: UserStatusProps) {
  return (
    <div className={`relative flex flex-col items-center p-3 rounded-lg transition-all ${
      isCurrentUser ? 'ring-2 ring-blue-500' : ''
    } ${!user.isConnected ? 'opacity-50' : ''}`}>
      {/* Avatar */}
      <div className="relative">
        <div className={`text-4xl mb-2 ${!user.isConnected ? 'grayscale' : ''}`}>
          {user.avatar}
        </div>
        
        {/* Connection Status Indicator */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
          user.isConnected ? 'bg-green-500' : 'bg-gray-400'
        }`} />
        
        {/* Scrum Master Badge */}
        {user.isScrumMaster && (
          <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs px-1 rounded">
            SM
          </div>
        )}
      </div>

      {/* User Name */}
      <p className={`text-sm font-medium text-center mb-1 ${
        !user.isConnected ? 'text-gray-500' : 'text-gray-800'
      }`}>
        {user.name}
        {isCurrentUser && ' (You)'}
      </p>

      {/* Vote Status */}
      <div className="flex items-center justify-center w-full">
        {isRevealed && vote !== undefined ? (
          <div className={`px-3 py-1 rounded-lg font-bold ${
            vote === 'coffee' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {vote === 'coffee' ? '☕' : vote}
          </div>
        ) : (
          <div className={`w-4 h-4 rounded-full ${
            hasVoted ? 'bg-green-500' : 'bg-red-500'
          }`} />
        )}
      </div>

      {/* Action Controls */}
      {showControls && !isCurrentUser && (
        <div className="absolute -top-2 -right-2 opacity-0 hover:opacity-100 transition-opacity">
          <div className="bg-white rounded-lg shadow-lg border p-1 flex gap-1">
            {onTransferRole && !user.isScrumMaster && (
              <button
                onClick={onTransferRole}
                className="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                title="Transfer Scrum Master role"
              >
                Make SM
              </button>
            )}
            {onKick && (
              <button
                onClick={onKick}
                className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                title="Remove from session"
              >
                Kick
              </button>
            )}
          </div>
        </div>
      )}

      {/* Disconnected Status */}
      {!user.isConnected && (
        <p className="text-xs text-gray-500 mt-1">Disconnected</p>
      )}
    </div>
  );
}