'use client';

import { SessionUser } from '@/lib/types/user';

interface UserAvatarProps {
  user: SessionUser;
  size?: number;
  showVoteStatus?: boolean;
  showConnectionStatus?: boolean;
  className?: string;
}

export const UserAvatar = ({ 
  user, 
  size = 64, 
  showVoteStatus = false,
  showConnectionStatus = true,
  className = ''
}: UserAvatarProps) => {
  const getVoteStatusColor = () => {
    if (!showVoteStatus) return '';
    return user.hasVoted ? 'ring-green-500' : 'ring-red-500';
  };

  const getConnectionOpacity = () => {
    if (!showConnectionStatus) return '';
    return user.isConnected ? 'opacity-100' : 'opacity-50';
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Avatar */}
      <div 
        className={`
          relative flex items-center justify-center rounded-full bg-white shadow-lg
          ${getVoteStatusColor() && 'ring-4'}
          ${getVoteStatusColor()}
          ${getConnectionOpacity()}
          transition-all duration-200
        `}
        style={{ width: size, height: size }}
      >
        <span 
          className="text-gray-800 select-none"
          style={{ fontSize: size * 0.5 }}
        >
          {user.avatar}
        </span>
        
        {/* Scrum Master crown */}
        {user.isScrumMaster && (
          <div 
            className="absolute -top-1 -right-1 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm"
            style={{ width: size * 0.3, height: size * 0.3 }}
          >
            <span style={{ fontSize: size * 0.15 }}>👑</span>
          </div>
        )}
        
        {/* Connection status indicator */}
        {showConnectionStatus && (
          <div 
            className={`
              absolute -bottom-1 -right-1 rounded-full border-2 border-white
              ${user.isConnected ? 'bg-green-400' : 'bg-gray-400'}
            `}
            style={{ width: size * 0.2, height: size * 0.2 }}
          />
        )}
      </div>
      
      {/* User name */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
        <span 
          className={`
            text-xs font-medium text-gray-700 text-center block truncate max-w-20
            ${!user.isConnected && 'opacity-50'}
          `}
        >
          {user.name}
        </span>
      </div>
    </div>
  );
};