'use client';

import { VoteValue } from '@/lib/types/vote';

interface VoteCardProps {
  value: VoteValue;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: (value: VoteValue) => void;
  className?: string;
}

export const VoteCard = ({
  value,
  isSelected = false,
  isDisabled = false,
  onClick,
  className = ''
}: VoteCardProps) => {
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick(value);
    }
  };

  const getCardContent = () => {
    if (value === 'coffee') {
      return '☕';
    }
    return value.toString();
  };

  const getCardStyles = () => {
    const baseStyles = `
      relative w-16 h-24 rounded-lg border-2 cursor-pointer
      flex items-center justify-center font-bold text-lg
      transition-all duration-200 transform
      select-none
    `;

    if (isDisabled) {
      return `${baseStyles} bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed`;
    }

    if (isSelected) {
      return `${baseStyles} bg-blue-600 border-blue-600 text-white scale-105 shadow-lg`;
    }

    return `${baseStyles} bg-white border-gray-300 text-gray-800 hover:border-blue-400 hover:scale-105 hover:shadow-md`;
  };

  const getTextSize = () => {
    if (value === 'coffee') return 'text-2xl';
    if (typeof value === 'number' && value >= 10) return 'text-base';
    return 'text-xl';
  };

  return (
    <button
      className={`${getCardStyles()} ${className}`}
      onClick={handleClick}
      disabled={isDisabled}
      type="button"
    >
      <span className={getTextSize()}>
        {getCardContent()}
      </span>
      
      {/* Card shine effect */}
      {!isDisabled && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transition-opacity duration-200" />
      )}
    </button>
  );
};