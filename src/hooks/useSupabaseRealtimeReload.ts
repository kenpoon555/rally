import { useEffect, useMemo } from 'react';
import { supabase } from '../services/api/supabase';

type RealtimeTable = 'activities' | 'join_requests' | 'messages';

/**
 * Refetch when Supabase Realtime reports table changes (requires publication + RLS read).
 */
export function useSupabaseRealtimeReload(
  tables: RealtimeTable[],
  onReload: () => void,
  enabled = true
): void {
  const tablesKey = useMemo(() => tables.join(','), [tables]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channel = supabase.channel(`reload-${tables.join('-')}-${Date.now()}`);
    for (const table of tables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          onReload();
        }
      );
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tables, tablesKey, onReload, enabled]);
}
