export type AvailabilityPollStatus = 'open' | 'closed';

export interface AvailabilityPollOption {
  id: string;
  label: string;
  starts_at: string;
  ends_at?: string | null;
  sort_order: number;
  vote_count: number;
}

export interface AvailabilityPoll {
  id: string;
  title: string;
  status: AvailabilityPollStatus;
  closes_at?: string | null;
  created_at: string;
  created_by: string;
  winning_option_id?: string | null;
  my_vote_option_id?: string | null;
  options: AvailabilityPollOption[];
}

export type AvailabilityPollOptionInput = {
  label: string;
  starts_at: string;
  ends_at?: string | null;
};
