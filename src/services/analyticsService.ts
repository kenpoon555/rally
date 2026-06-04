import { supabase } from './api/supabase';
import { ProductEventName } from '../types/metrics';

export async function trackProductEvent(
  eventName: ProductEventName,
  properties: Record<string, unknown> = {},
  userId?: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('track_product_event', {
      p_event_name: eventName,
      p_properties: properties,
      p_user_id: userId ?? undefined,
    });
    if (error && __DEV__) {
      console.warn('Analytics event skipped:', eventName, error.message);
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('Analytics event failed:', eventName, e);
    }
  }
}
