import { supabase } from './api/supabase';
import { trackProductEvent } from './analyticsService';
import {
  AvailabilityPoll,
  AvailabilityPollOptionInput,
} from '../types/availabilityPoll';

export const getConversationPolls = async (
  conversationId: string
): Promise<AvailabilityPoll[]> => {
  const { data, error } = await supabase.rpc('get_conversation_polls', {
    p_conversation_id: conversationId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as AvailabilityPoll[];
};

export const createAvailabilityPoll = async (params: {
  groupId: string;
  conversationId: string;
  title: string;
  options: AvailabilityPollOptionInput[];
  closesAt?: string | null;
}): Promise<string> => {
  const { data, error } = await supabase.rpc('create_availability_poll', {
    p_group_id: params.groupId,
    p_conversation_id: params.conversationId,
    p_title: params.title,
    p_options: params.options,
    p_closes_at: params.closesAt ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Failed to create poll');
  }
  await trackProductEvent('poll_created', {
    poll_id: data,
    group_id: params.groupId,
    option_count: params.options.length,
  });
  return data as string;
};

export const voteAvailabilityPoll = async (
  pollId: string,
  optionId: string
): Promise<void> => {
  const { error } = await supabase.rpc('vote_availability_poll', {
    p_poll_id: pollId,
    p_option_id: optionId,
  });
  if (error) {
    throw new Error(error.message);
  }
  await trackProductEvent('poll_voted', { poll_id: pollId, option_id: optionId });
};

export const closeAvailabilityPoll = async (
  pollId: string,
  winningOptionId?: string | null
): Promise<void> => {
  const { error } = await supabase.rpc('close_availability_poll', {
    p_poll_id: pollId,
    p_winning_option_id: winningOptionId ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
};
