# Phase 8 Chat Validation Checklist

Last updated: 2026-02-27

Use this checklist to validate activity group chat and friend direct chat with realtime delivery and membership controls.

## How to work on this

1. **DB smoke (done)**  
   Tables `conversations`, `conversation_members`, `messages` and RPCs `get_or_create_direct_conversation`, `create_activity_group_conversation` are present and RLS-enabled. No action needed unless you add migrations.

2. **Device validation (manual)**  
   You need two devices (or simulator + device) and **three accounts** (A = host, B = participant/friend, C = non-member).  
   - **Friend chat:** Friends tab → tap a friend’s **Chat** → opens direct thread. From B, open Chats (Home or Friends) → same thread.  
   - **Activity group chat:** As host A, finalize an activity with B approved → Activity detail → **Open Activity Chat**. As B, open the same activity → same **Open Activity Chat** (or find thread in Chats).  
   - **Realtime:** Keep both in same thread; send from each; background one device, send from the other, bring back and confirm new message appears.  
   - **Unread:** Leave messages unread on A, open Chats list (badge), then open thread and confirm badge clears.  
   - **RLS (Case 4):** Use Account C; C should not see A/B’s thread in Chats. If you have a way to open a conversation by ID as C, verify read/send is blocked.  
   - **Leave (Case 6):** There is no “Leave conversation” in the UI yet; you can skip or test via SQL (`update conversation_members set is_active = false` for B, then have A send and confirm B cannot access).

3. **Record results**  
   In `docs/phase-6-8-validation-results.md`, under **Phase 8: Chat**, check the device validation boxes for iOS/Android and add a short note for any failure or defect.

## Preconditions

- Migration `supabase/migrations/004_reviews_and_chat.sql` has been applied.
- Realtime is enabled for `messages`.
- At least three accounts are available:
  - Account A (host)
  - Account B (participant/friend)
  - Account C (non-member for permission testing)

## Platform Matrix

- [ ] iOS pass
- [ ] Android pass

## Case 1: Activity group conversation auto-create

Steps:

1. Account A finalizes an activity with approved participants.
2. Trigger/create group conversation flow.
3. Open conversation list/thread for A and B.

Expected:

- Exactly one `activity_group` conversation exists per activity.
- Host and approved participants are members.

Failure signals:

- Multiple group conversations created for same activity.
- Approved participant missing from membership list.

## Case 2: Friend direct conversation bootstrap

Steps:

1. Ensure Account A and B have accepted friendship.
2. Open friend chat from Friends tab.
3. Re-open from both accounts.

Expected:

- One reusable direct conversation thread for same friend pair.
- Conversation opens for both users.

Failure signals:

- New thread created each time for same pair.

## Case 3: Realtime send/receive

Steps:

1. Keep A and B on same thread.
2. Send messages from both accounts.
3. Background one device and continue sending from the other.

Expected:

- Messages appear in near realtime.
- Message ordering is stable by `created_at`.
- Background -> foreground returns to up-to-date thread.

Failure signals:

- Missing messages, delayed sync, or duplicate inserts.

## Case 4: Membership/RLS enforcement

Steps:

1. Account C attempts to read/send in A/B conversation via UI and SQL client.
2. Account B attempts to edit/delete Account A messages.

Expected:

- Non-member cannot read/send messages.
- Users can only edit/delete their own messages.

Failure signals:

- Unauthorized user can read or send.

## Case 5: Read state and unread indicators

Steps:

1. Account A leaves unread messages from B.
2. Open conversation list and thread.
3. Validate unread count clears when thread is read.

Expected:

- Unread badge increments when new message arrives.
- Unread state clears after reading.

Failure signals:

- Badge count stuck or never increments.

## Case 6: Leave conversation behavior

Steps:

1. Account B leaves/deactivates membership.
2. Account A sends additional messages.
3. Account B attempts to read/send again.

Expected:

- Inactive member no longer receives/sends new messages.
- Access is blocked unless re-added.

Failure signals:

- Removed member still has live access.

## Verification SQL

```sql
-- Conversations
select id, conversation_type, activity_id, created_by, created_at
from conversations
order by created_at desc
limit 30;
```

```sql
-- Members
select id, conversation_id, user_id, role, is_active, last_read_at
from conversation_members
order by joined_at desc
limit 50;
```

```sql
-- Messages
select id, conversation_id, sender_id, message_type, content, created_at, deleted_at
from messages
order by created_at desc
limit 50;
```

## Phase 8 Exit Criteria

- [ ] Activity group conversation creation validated.
- [ ] Direct friend conversation bootstrap validated.
- [ ] Realtime message delivery validated.
- [ ] Message/member RLS validated.
- [ ] Unread indicator behavior validated.

## Results Logging

- Summarize pass/fail and defects in `docs/phase-6-8-validation-results.md` under Phase 8 section.
