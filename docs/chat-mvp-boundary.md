# Chat: MVP scope and scale boundary

Last updated: 2026-05-30

## Product role (locked for MVP)

- **Chat is coordination around a game**, not the primary matching mechanism.
- **Game lobby chat** opens when the host creates a game (host only) and expands as join requests are approved.
- **Roster sync:** approved players are added; withdrawn/rejected players are deactivated in chat (pre-finalize).
- **Post-finalize (Stage 2.5):** host locks roster; chat membership frozen — not yet enforced for fixed games.
- **Direct (friend) chat** is for accepted friends.

## Current stack

- Supabase Postgres tables: `conversations`, `conversation_members`, `messages`.
- Realtime: `postgres_changes` on `messages` per thread in [`src/services/chatService.ts`](../src/services/chatService.ts).

## Deferred work (do after MVP product shape is stable)

High impact before claiming “high throughput / low latency”:

1. **Unread counts** — replace client-side full-table scans with SQL counts or materialized per-member unread (see `getUnreadConversationCounts`).
2. **Pagination** — keyset pagination for message history (threads currently load latest N only).
3. **Conversation ordering** — ensure `last_message_at` or bump `conversations.updated_at` on new messages so lists sort by recency.
4. **Read receipts** — batch or throttle `markConversationRead` on rapid message streams.

## When to reconsider architecture

- Only if production metrics show Supabase Realtime or Postgres write rates as the bottleneck.
- Alternatives (later): dedicated chat vendor, Edge relay, or partitioned message store—**not** required for initial niche launch.
