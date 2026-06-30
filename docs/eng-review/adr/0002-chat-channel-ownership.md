# ADR-0002: Introduce a channel-ownership hook for conversation realtime

- **Status:** accepted
- **Date:** 2026-06-28
- **Lens / source:** `realtime-fanout-reviewer` ([review](../realtime-fanout-reviewer/2026-06-28-review.md))
- **Severity:** P1
- **Deciders:** Ken (founder)

## Context

`subscribeToConversationMessages` (`chatService.ts:430`) creates a Supabase realtime channel named `conversation-{id}`, registers one `postgres_changes` listener on the `messages` table, and **immediately calls `.subscribe()`**. The caller receives the subscribed channel only for teardown.

Once a channel is subscribed, Supabase JS v2 does not allow adding additional `.on()` listeners. This means any new realtime event type (reactions, typing indicators, pinned message updates) **must open a second channel** to the same conversation — or refactor.

At the current feature set this works: one channel, one listener, correct teardown in both callers (`ChatThreadScreen` and `RegularsCrewScreen`). The problem is the **next feature on the roadmap**: message reactions (P1) require `message_reactions` INSERT events on the same conversation. Without a shared channel, reactions would add a second `conversation-{id}` socket per open chat. A 200-member group rally = 200 clients × 2 channels = 400 concurrent subscriptions instead of 200.

## Decision

Introduce a **`useChatChannel(conversationId)` hook** (or `ChatChannelContext`) that:
1. Opens `supabase.channel('conversation-{id}')` once on mount.
2. Exposes a `register(table, filter, handler)` method so any feature (messages, reactions, future) can add a listener **before the channel subscribes**.
3. Subscribes the channel after all listeners are registered (first render).
4. Tears down the single channel on unmount.

`subscribeToConversationMessages` becomes a thin wrapper that calls `useChatChannel(id).register('messages', ..., cb)` rather than opening its own channel.

`ChatThreadScreen` and `RallyChatPanel` mount `useChatChannel` at the screen level; the reactions feature adds a listener without any channel change.

## Consequences

- **Positive:** one socket per open conversation regardless of feature count; reactions, typing indicators, etc. are additive with no architectural cost.
- **Negative / cost:** requires replacing the current `subscribeToConversationMessages` call-site pattern (2 screens); moderate refactor risk; needs to land **before** reactions ship to avoid the 2-channel problem.
- **Follow-ups (mechanical, can land first):**
  - Abort flag in `useJoinRequestNotifications` (Finding 2, independent)
  - Rename `channel('activities')` (Finding 3, independent)
  - Cap `getLastMessagePreviews` fallback (Finding 4, independent)

## Alternatives considered

| Option | Why not |
|--------|---------|
| Second `channel('reactions-{id}')` per chat | 2× connections per open chat; scales linearly with features |
| Extend `subscribeToConversationMessages` to accept multiple handlers | Still creates the channel eagerly; can't add handlers after subscribe |
| Supabase multiplexing (single WS, virtual channels) | This is what Supabase Realtime already does at the transport layer — but each `channel()` call is still a separate logical subscription; doesn't solve the listener-sharing problem |

## Verification

- Open any chat: `supabase.getChannels()` returns exactly **1** channel named `conversation-{id}` (not 2+).
- Navigate away and back: channel count returns to 0 after unmount.
- With reactions enabled: the same 1 channel has 2 listeners (`messages`, `message_reactions`); no second channel opened.
