'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AvatarPicker } from '@/components/AvatarPicker';
import { validateUserName } from '@/lib/storage/userPreferences';
import { getRandomAvatar } from '@/lib/constants/avatars';

interface UserSetupProps {
  isOpen: boolean;
  onComplete: (name: string, avatar: string) => void;
  initialName?: string;
  initialAvatar?: string;
}

export function UserSetup({ 
  isOpen, 
  onComplete, 
  initialName = '', 
  initialAvatar 
}: UserSetupProps) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar || getRandomAvatar().id);
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && !initialAvatar) {
      setAvatar(getRandomAvatar().id);
    }
  }, [isOpen, initialAvatar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    
    const validation = validateUserName(name);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(name.trim(), avatar);
    } catch {
      setError('Failed to save preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Welcome to MagnaPP!"
      closeOnOverlayClick={false}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Let&apos;s set up your profile to get started with Planning Poker.
          </p>
        </div>

        <div>
          <Input
            label="Your Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(undefined);
            }}
            error={error}
            placeholder="Enter your name"
            maxLength={20}
            fullWidth
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Choose Your Avatar
          </label>
          <AvatarPicker
            selectedAvatar={avatar}
            onSelect={setAvatar}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? 'Saving...' : 'Get Started'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}