import { supabase } from './api/supabase';
import { RateLimitMetric, RateLimitResult } from '../types/metrics';

const LIMIT_MESSAGES: Record<RateLimitMetric, string> = {
  discovery_search:
    'You have reached today’s discovery limit. Try again tomorrow or upgrade when Player Plus is available.',
  chat_message: 'You have reached today’s message limit. Try again tomorrow.',
  push_send: 'Push notification limit reached for today.',
  chat_create: 'You have reached today’s limit for starting new chats. Try again tomorrow.',
};

export async function consumeRateLimit(
  metric: RateLimitMetric,
  userId?: string
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc('consume_rate_limit', {
    p_metric: metric,
    p_user_id: userId ?? undefined,
  });

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  const result = (data || { allowed: true }) as RateLimitResult;
  if (result.skipped) {
    return { ...result, allowed: true };
  }
  if (!result.allowed) {
    throw new Error(LIMIT_MESSAGES[metric]);
  }
  return result;
}
