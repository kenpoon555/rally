import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './api/supabase';
import { ProductEventName } from '../types/metrics';

const SIGNUP_TRACKED_PREFIX = 'rally:analytics:signup:';

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

/** First auth on this device for a new account (signup or email-confirm). */
export async function trackSignupCompletedOnce(userId: string): Promise<void> {
  const key = `${SIGNUP_TRACKED_PREFIX}${userId}`;
  if (await AsyncStorage.getItem(key)) {
    return;
  }
  await trackProductEvent('signup_completed', {}, userId);
  await AsyncStorage.setItem(key, '1');
}

export function isRecentlyCreatedAuthUser(createdAt: string | undefined): boolean {
  if (!createdAt) {
    return false;
  }
  const createdMs = new Date(createdAt).getTime();
  return Date.now() - createdMs < 15 * 60 * 1000;
}

export async function activityAnalyticsProps(
  activityId: string
): Promise<{ activity_id: string; group_id?: string }> {
  const { data } = await supabase
    .from('activities')
    .select('regular_group_id')
    .eq('id', activityId)
    .maybeSingle();
  const props: { activity_id: string; group_id?: string } = { activity_id: activityId };
  if (data?.regular_group_id) {
    props.group_id = data.regular_group_id;
  }
  return props;
}

export function trackCrewJoined(groupId: string): void {
  void trackProductEvent('crew_joined', { group_id: groupId });
}
