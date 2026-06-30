# Engineering Contracts

**Living reference for code-level contracts.** Read the relevant section before touching a domain. Update this file in the same PR as any change to a table schema, service API, realtime channel, or shared component interface.

> Merge conflicts happen when two branches edit the same file without knowing each other's changes. This file makes that visible before you branch.

---

## How to use

1. **Starting work** → find your domain below, read the "files in scope" list. Those are the files other PRs will also touch.
2. **After landing** → if you changed a schema, API signature, or component interface, update the relevant section here.
3. **Branching rule** → always branch from latest `dev` (or rebase before opening PR) to avoid conflicts in shared files.

---

## Domain map — which files are "hot" per feature area

| Domain | Hot files (expect conflicts here) |
|--------|---------------------------------|
| Chat messages | `chatService.ts`, `ChatThreadScreen.tsx`, `RallyChatPanel.tsx`, `types/chat.ts`, `ChatMessageBubble.tsx`, `useChatChannel.ts` |
| Message reactions | `reactionService.ts`, `types/chat.ts`, `ChatMessageBubble.tsx`, `ReactionPicker.tsx`, `ReactionRow.tsx` |
| Discover / activities | `activityService.ts`, `useActivities.ts`, `types/activity.ts`, `DiscoverScreen.tsx` |
| Game room | `GameRoomActionBar.tsx`, `ChatThreadScreen.tsx`, `activityService.ts` |
| Navigation | `src/navigation/types.ts`, `AppNavigator.tsx`, `ROUTES` constants |
| Auth / profiles | `AuthContext.tsx`, `userService.ts`, `types/user.ts` |
| Realtime channels | `useChatChannel.ts` — all chat realtime goes through here |

---

## Chat & Messaging

### DB Schema — `messages`

```sql
messages (
  id uuid PK,
  conversation_id uuid → conversations,
  sender_id uuid → profiles,
  message_type text CHECK ('text' | 'system' | 'recap'),
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,        -- soft delete; filter with .is('deleted_at', null)
  activity_id uuid nullable,
  recap_id uuid nullable
)
-- RLS: conversation members only
```

### DB Schema — `message_reactions` (migration 076)

```sql
message_reactions (
  id uuid PK,
  message_id uuid → messages ON DELETE CASCADE,
  user_id uuid → profiles ON DELETE CASCADE,
  emoji text CHECK ('👍' | '❤️' | '😂' | '🔥' | '💪'),
  created_at timestamptz,
  UNIQUE (message_id, user_id, emoji)
)
-- RLS: read = conversation member; insert = member + text-only + non-deleted msg; delete = own row
-- Realtime: published via supabase_realtime
```

### DB Schema — `conversations` / `conversation_members`

```sql
conversations (id, conversation_type CHECK ('activity_group'|'friend_direct'|'crew_group'), activity_id, regular_group_id, ...)
conversation_members (conversation_id, user_id, role, is_active, last_read_at, ...)
```

### Service API — `chatService.ts`

```ts
getConversationMessages(conversationId, limit?, before?)  // before = ISO timestamp keyset cursor
getMyConversations(userId)                               // capped at 200
sendConversationMessage(conversationId, senderId, content)
markConversationRead(conversationId, userId)
getLastMessagePreviews(conversationIds[])
takeCachedConversationMessages(conversationId)
prefetchConversationMessages(conversationId, limit?)
```

`withRetry` wraps all writes; adds 300ms delay before retry.

### Service API — `reactionService.ts`

```ts
getReactionsForMessages(messageIds[])   // batch fetch by message IDs
addReaction(messageId, emoji)
removeReaction(messageId, emoji)
```

### Realtime — `useChatChannel(conversationId)`

**Contract:** one Supabase channel per conversation. All listeners on that conversation share a single socket.

```ts
// Step 1 — register all listeners BEFORE subscribe()
chatChannel.register({ table, event, filter?, handler })

// Step 2 — subscribe once, after all register() calls
chatChannel.subscribe(onReconnect?)
```

**Current listeners in ChatThreadScreen + RallyChatPanel:**

| table | event | filter | purpose |
|-------|-------|--------|---------|
| `messages` | INSERT | `conversation_id=eq.{id}` | new message arrives |
| `message_reactions` | INSERT | _(none — RLS scopes)_ | reaction added |
| `message_reactions` | DELETE | _(none — RLS scopes)_ | reaction removed |

**Rule:** `filter` is optional. Omit it (or pass `undefined`) to subscribe to all rows the user can see via RLS. Never pass `''` — Supabase will attempt to parse it and error.

### TypeScript types — `types/chat.ts`

```ts
ChatMessage { id, conversation_id, sender_id, message_type, content, created_at, ... }
MessageReaction { id, message_id, user_id, emoji, created_at }
REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '💪']
ReactionEmoji   = typeof REACTION_EMOJIS[number]
```

### Component — `ChatMessageBubble`

```ts
Props {
  message: ChatMessage
  isMine: boolean
  reactions?: MessageReaction[]          // for this message only
  currentUserId?: string
  onLongPressOther?: (msg) => void       // safety/report — fires for non-mine only
  onLongPressReact?: (msg) => void       // reaction picker — fires for all text messages
  onToggleReaction?: (messageId, emoji) => void
}
```

`onLongPressReact` takes priority over `onLongPressOther`. Pass only the one that applies.

---

## Activity / Discover

### DB Schema — `activities` (key columns)

```sql
activities (
  id, user_id, sport_type, start_time, duration, status CHECK ('active'|'completed'|'cancelled'),
  match_status CHECK ('open'|'collecting'|'finalized'|'cancelled'),
  visibility CHECK ('public'|'nearby'|'invite_only'),
  regular_group_id nullable,   -- set = crew game
  expires_at nullable,
  ...
)
join_requests (id, activity_id, user_id, status CHECK ('pending'|'approved'|'rejected'|'waitlisted'), ready_at, ...)
```

### Service API — `activityService.ts` (discover path)

```ts
getNearbyActivities(lat?, lng?, radius?, sportType?)
  // 1. tries discover_activities() RPC (PostGIS, keyset paged)
  // 2. falls back to queryDiscoverActivities() on error
  // 3. merges hostedActive, applies geo filter client-side on fallback
  // 4. skips enrichActivitiesWithJoinRequests when RPC succeeded (embedded)

enrichActivitiesWithJoinRequests(activities, viewerId?)
  // approvedRes query capped at activityIds.length * 20 rows
```

### DB RPC — `discover_activities` (migration 075)

```sql
discover_activities(p_viewer, p_lat, p_lng, p_radius_m, p_sport, p_limit, p_cursor_start_time, p_cursor_id)
RETURNS TABLE(activity jsonb, distance_m float8)
SECURITY DEFINER  -- bypasses RLS; explicit WHERE visibility/status filters required
```

---

## Navigation

### Source of truth — `src/navigation/types.ts`

All route param types live here. Global augmentation means `useNavigation()` is fully typed with no casts.

```ts
// Adding a new screen:
// 1. Add route to ROUTES constants
// 2. Add param type to RootStackParamList (or AuthStackParamList / MainTabParamList)
// 3. Register the screen in AppNavigator.tsx
// Never add a local *ParamList type in a screen file — always import from types.ts
```

**Invariant:** `grep -rn "as never" src/` should return 0 results.

---

## Realtime channel ownership

| Channel name | Created by | Purpose |
|-------------|------------|---------|
| `conversation-{id}` | `useChatChannel` | All chat events (messages + reactions) for one conversation |
| `game-room-join-{activityId}` | `GameRoomActionBar` | Join request INSERT/UPDATE/DELETE for host panel |
| `activities-discover` | `useActivities` | Discover feed realtime updates |
| `join-request-notifications-{userId}` | `useJoinRequestNotifications` | Host notifications for incoming requests |

**Rule:** channel names must be unique per resource. Never create two channels for the same conversation — use `useChatChannel` for everything chat-related.

---

## PR checklist — contracts

When your PR touches a domain above, add this to the PR description and check each item:

- [ ] DB schema change → migration file added, `ENGINEERING-CONTRACTS.md` updated
- [ ] New exported service function → signature added to contracts above
- [ ] New/changed component props → interface updated above
- [ ] New realtime subscription → channel added to the ownership table above
- [ ] New route → added to `src/navigation/types.ts` AND `ROUTES` constants
- [ ] Rebased onto latest `dev` before opening PR
