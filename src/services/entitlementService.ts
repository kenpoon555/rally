import { supabase } from './api/supabase';
import { EntitlementFeature, UserEntitlement } from '../types/entitlements';

/**
 * Monetization-ready gate — returns false for all users until entitlements are granted.
 * Paid UI should call this before rendering; free loop ignores it.
 */
export async function hasEntitlement(
  featureKey: EntitlementFeature,
  userId?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('user_has_entitlement', {
      p_feature_key: featureKey,
      p_user_id: userId ?? undefined,
    });
    if (error) {
      return false;
    }
    return data === true;
  } catch {
    return false;
  }
}

export async function getUserEntitlements(userId: string): Promise<UserEntitlement[]> {
  const { data, error } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as UserEntitlement[];
}

/** Wrap future paid surfaces — no-op when entitled or feature not built yet. */
export function gatePaidFeature(
  entitled: boolean,
  onBlocked?: () => void
): boolean {
  if (entitled) {
    return true;
  }
  onBlocked?.();
  return false;
}
