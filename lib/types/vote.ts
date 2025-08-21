export type VoteValue = 1 | 2 | 3 | 5 | 8 | 13 | 21 | 'coffee';

export interface Vote {
  userId: string;
  value: VoteValue;
  submittedAt: Date;
}

export interface VoteStatistics {
  average: number | null;
  distribution: Map<VoteValue, number>;
  hasConsensus: boolean;
  totalVotes: number;
  coffeeVotes: number;
}