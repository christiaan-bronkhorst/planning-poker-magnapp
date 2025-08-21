'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function CreateSessionModal({ isOpen, onClose, onCreate }: CreateSessionModalProps) {
  const [sessionName, setSessionName] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (!sessionName.trim()) {
      setError('Session name is required');
      return;
    }

    if (sessionName.trim().length < 3) {
      setError('Session name must be at least 3 characters');
      return;
    }

    if (sessionName.trim().length > 50) {
      setError('Session name must be 50 characters or less');
      return;
    }

    setIsCreating(true);
    try {
      await onCreate(sessionName.trim());
      setSessionName('');
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create session. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setSessionName('');
      setError(undefined);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Session"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Session Name"
          value={sessionName}
          onChange={(e) => {
            setSessionName(e.target.value);
            setError(undefined);
          }}
          error={error}
          placeholder="e.g., Sprint 23 Planning"
          maxLength={50}
          fullWidth
          autoFocus
          required
          disabled={isCreating}
        />

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating || !sessionName.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Session'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}