import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/api/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ChangeHandler = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;

interface ListenerConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  handler: ChangeHandler;
}

export interface ChatChannelHandle {
  /** Register a postgres_changes listener. Call before subscribe(). */
  register: (config: ListenerConfig) => void;
  /** Subscribe the channel. Call after all register() calls. */
  subscribe: (onReconnect?: () => void) => void;
}

function attachListener(
  channel: ReturnType<typeof supabase.channel>,
  config: ListenerConfig
): void {
  const opts: Record<string, unknown> = {
    event: config.event,
    schema: 'public',
    table: config.table,
  };
  if (config.filter) opts.filter = config.filter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (channel as any).on('postgres_changes', opts, config.handler);
}

export function useChatChannel(conversationId: string): ChatChannelHandle {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscribedRef = useRef(false);
  const pendingRef = useRef<ListenerConfig[]>([]);

  // (Re)create the raw channel whenever conversationId changes
  useEffect(() => {
    if (!conversationId) return;

    const ch = supabase.channel(`conversation-${conversationId}`);
    channelRef.current = ch;
    subscribedRef.current = false;
    pendingRef.current = [];

    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
      subscribedRef.current = false;
    };
  }, [conversationId]);

  const register = useCallback((config: ListenerConfig) => {
    if (channelRef.current && !subscribedRef.current) {
      attachListener(channelRef.current, config);
    } else {
      // Queue for when the channel is ready (shouldn't normally happen)
      pendingRef.current.push(config);
    }
  }, []);

  const subscribe = useCallback((onReconnect?: () => void) => {
    if (!channelRef.current || subscribedRef.current) return;

    // Apply any queued registrations
    for (const cfg of pendingRef.current) {
      attachListener(channelRef.current, cfg);
    }
    pendingRef.current = [];

    subscribedRef.current = true;
    let hasConnectedOnce = false;

    channelRef.current.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        if (hasConnectedOnce) {
          // Reconnect after network drop — trigger backfill (E4 fix)
          onReconnect?.();
        }
        hasConnectedOnce = true;
      }
    });
  }, []);

  return { register, subscribe };
}
