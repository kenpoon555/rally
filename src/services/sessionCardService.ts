import { supabase } from './api/supabase';
import {
  ConversationSessionCard,
  SessionCardPayload,
} from '../types/sessionCard';

export const getSessionCardPayload = async (
  activityId: string
): Promise<SessionCardPayload> => {
  const { data, error } = await supabase.rpc('get_session_card_payload', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data as SessionCardPayload;
};

export const listCrewSessionCards = async (
  groupId: string,
  limit = 12
): Promise<SessionCardPayload[]> => {
  const { data, error } = await supabase.rpc('list_crew_session_cards', {
    p_regular_group_id: groupId,
    p_limit: limit,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as SessionCardPayload[] | null) ?? [];
};

export const listConversationSessionCards = async (
  conversationId: string
): Promise<ConversationSessionCard[]> => {
  try {
    const { data, error } = await supabase.rpc('list_conversation_session_cards', {
      p_conversation_id: conversationId,
    });
    if (error) {
      throw new Error(error.message);
    }
    return (data as ConversationSessionCard[] | null) ?? [];
  } catch (error) {
    if (__DEV__) {
      console.warn('listConversationSessionCards failed:', error);
    }
    return [];
  }
};
