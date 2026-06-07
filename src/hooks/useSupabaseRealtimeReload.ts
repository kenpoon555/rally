import { useEffect, useRef } from 'react';
import { supabase } from '../services/api/supabase';

type RealtimeTable = 'activities' | 'join_requests' | 'messages';

/** Stable table lists — never pass inline array literals to the hook. */
export const REALTIME_MY_GAMES_TABLES: readonly RealtimeTable[] = [
  'activities',
  'join_requests',
];

export const REALTIME_INBOX_TABLES: readonly RealtimeTable[] = [
  'activities',
  'join_requests',
  'messages',
];

/**
 * Refetch when Supabase Realtime reports table changes (requires publication + RLS read).
 * Pass a module-level constant for `tables` so the subscription is not recreated every render.
 */
export function useSupabaseRealtimeReload(
  tables: readonly RealtimeTable[],
  onReload: () => void,
  enabled = true,
  debounceMs = 0
): void {
  const tablesKey = tables.join(',');
  const onReloadRef = useRef(onReload);
  onReloadRef.current = onReload;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const scheduleReload = () => {
      if (debounceMs <= 0) {
        onReloadRef.current();
        return;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        onReloadRef.current();
      }, debounceMs);
    };

    const channel = supabase.channel(`reload-${tablesKey}`);
    for (const table of tables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        scheduleReload
      );
    }

    channel.subscribe();
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [tables, tablesKey, enabled, debounceMs]);
}
