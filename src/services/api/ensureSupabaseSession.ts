import { supabase } from './supabase';

/**
 * Wait for AsyncStorage session restore and refresh if the access token is stale.
 * Discover/My Games queries return empty (not an error) when a bad JWT is sent.
 */
export async function ensureSupabaseSessionReady(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return;
  }

  const expiresAtMs = session.expires_at ? session.expires_at * 1000 : 0;
  const needsRefresh = !expiresAtMs || expiresAtMs - Date.now() < 120_000;

  if (needsRefresh) {
    await supabase.auth.refreshSession();
    return;
  }

  const { error: userError } = await supabase.auth.getUser();
  if (userError) {
    await supabase.auth.refreshSession();
  }
}
