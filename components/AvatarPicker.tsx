'use client';

import { AVATARS } from '@/lib/constants/avatars';

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelect: (avatarId: string) => void;
}

export function AvatarPicker({ selectedAvatar, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          onClick={() => onSelect(avatar.id)}
          className={`
            p-3 rounded-lg border-2 transition-all
            ${selectedAvatar === avatar.id 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-110' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }
          `}
          title={avatar.name}
          aria-label={`Select ${avatar.name} avatar`}
          aria-pressed={selectedAvatar === avatar.id}
        >
          <span className="text-3xl" role="img" aria-label={avatar.name}>
            {avatar.emoji}
          </span>
        </button>
      ))}
    </div>
  );
}