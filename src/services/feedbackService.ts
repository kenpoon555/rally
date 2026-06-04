import { supabase } from './api/supabase';

export type ProductFeedbackRow = {
  id: string;
  user_id: string;
  username: string;
  body: string;
  screen: string | null;
  activity_id: string | null;
  created_at: string;
};

export async function submitProductFeedback(
  body: string,
  screen?: string,
  activityId?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('submit_product_feedback', {
    p_body: body,
    p_screen: screen ?? null,
    p_activity_id: activityId ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  return String(data);
}

export async function listAdminProductFeedback(limit = 50): Promise<ProductFeedbackRow[]> {
  const { data, error } = await supabase.rpc('admin_list_product_feedback', { p_limit: limit });
  if (error) {
    throw new Error(error.message);
  }
  return (data || []) as ProductFeedbackRow[];
}
