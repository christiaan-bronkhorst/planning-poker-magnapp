import { VoteValue } from '@/lib/types/vote';

export interface CreateSessionRequest {
  name: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface JoinSessionRequest {
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface SubmitVoteRequest {
  value: VoteValue;
}

export interface TransferScrumMasterRequest {
  newScrumMasterId: string;
}

export interface KickUserRequest {
  reason?: string;
}

export function validateCreateSession(body: any): CreateSessionRequest | null {
  if (!body?.name || typeof body.name !== 'string') {
    return null;
  }
  
  if (!body?.user?.id || !body?.user?.name) {
    return null;
  }

  if (typeof body.user.id !== 'string' || typeof body.user.name !== 'string') {
    return null;
  }

  return {
    name: body.name.trim(),
    user: {
      id: body.user.id,
      name: body.user.name.trim(),
      avatar: body.user.avatar || undefined,
    },
  };
}

export function validateJoinSession(body: any): JoinSessionRequest | null {
  if (!body?.user?.id || !body?.user?.name) {
    return null;
  }

  if (typeof body.user.id !== 'string' || typeof body.user.name !== 'string') {
    return null;
  }

  return {
    user: {
      id: body.user.id,
      name: body.user.name.trim(),
      avatar: body.user.avatar || undefined,
    },
  };
}

export function validateSubmitVote(body: any): SubmitVoteRequest | null {
  const validValues: VoteValue[] = [1, 2, 3, 5, 8, 13, 21, 'coffee'];
  
  if (!body?.value || !validValues.includes(body.value)) {
    return null;
  }

  return {
    value: body.value,
  };
}

export function validateTransferScrumMaster(body: any): TransferScrumMasterRequest | null {
  if (!body?.newScrumMasterId || typeof body.newScrumMasterId !== 'string') {
    return null;
  }

  return {
    newScrumMasterId: body.newScrumMasterId,
  };
}

export function isValidGuid(guid: string): boolean {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(guid);
}