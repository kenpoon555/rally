# V2-V4 Implementation Backlog

Last updated: 2026-02-23

This backlog converts roadmap bullets into delivery-ready epics and stories.

## Execution Status Snapshot

- V2.1-1 Flexible Activity Finalization: **mostly complete** (migrations + create/detail UI + finalize RPC wiring done; device QA pending).
- V2.1-2 Reviews + Anonymous Identity: **mostly complete** (schema, identity helper, review service, and review UI scaffold done; abuse controls pending).
- V2.1-3 Profile + Preference Center: **complete for MVP scope** (profile route/screen, defaults, create prefill, mismatch hint done).
- V2.1-4 Chat Foundation: **mostly complete** (direct/activity chat, realtime subscription, unread/read sync done; moderation/report pending).

## Priority Order

1. V2.1 Match Optimization + Identity Trust
2. V3 Community Growth + Programs
3. V4 Owned Facilities + Membership

## V2.1: Match Optimization + Identity Trust

### Epic V2.1-1: Flexible Activity Finalization

- **Goal:** Let host define constraints while system finalizes best time/location from participant preferences.
- **Stories:**
  - Add create flow mode for host constraints (time window + duration + candidate locations).
  - Add participant preference submission (availability + preferred location).
  - Add host finalization action backed by deterministic RPC scoring.
  - Show activity state (`open`, `collecting`, `finalized`) in Discover and detail surfaces.
- **Schema/API impact:**
  - `activities` additions: `scheduling_mode`, `window_start`, `window_end`, `match_status`, `finalized_at`, `finalized_by`.
  - New tables: `activity_candidate_locations`, `activity_participant_preferences`.
  - New RPC: `finalize_activity_best_slot`.
- **App impact:**
  - `src/pages/Activity/CreateActivityScreen.tsx`
  - `src/services/activityService.ts`
  - `src/pages/Home/HomeScreen.tsx`
- **Acceptance criteria:**
  - Two-account flow can collect preferences and finalize one deterministic slot.
  - Finalized activity state and final slot are visible to all participants.

### Epic V2.1-2: Reviews + Anonymous-until-confirmed Identity

- **Goal:** Increase trust with structured post-match reviews while preserving privacy before confirmation.
- **Stories:**
  - Add post-match rating flow (friendliness, physicality, overall vibe).
  - Enforce one review per reviewer/reviewed/activity.
  - Add aggregate profile score gated behind 5+ reviews.
  - Mask participant identity until confirmation; reveal to confirmed participants and accepted friends.
- **Schema/API impact:**
  - New table: `player_reviews`.
  - New aggregate view: `profile_review_stats`.
  - New helper function: `can_view_profile_identity`.
- **App impact:**
  - `src/types/user.ts`
  - `src/services/userService.ts`
  - `src/services/friendsService.ts`
  - `src/pages/Activity/ActivityDetailScreen.tsx`
- **Acceptance criteria:**
  - Review score remains hidden when review count < 5.
  - Identity remains masked before confirmation across API + UI paths.

### Epic V2.1-3: Profile + Preference Center

- **Goal:** Let users store default preferences and reuse them in activity creation.
- **Stories:**
  - Add profile screen with nickname/photo and default play settings.
  - Add home profile icon shortcut and preference hint card.
  - Prefill create activity with profile defaults.
  - Add mismatch hint when selected activity diverges from saved preferences.
- **Schema/API impact:**
  - `profiles` additions: `nickname`, `default_duration`, `default_visibility`, `default_distance_meters`, time-window defaults.
- **App impact:**
  - `src/pages/Profile/ProfileScreen.tsx`
  - `src/navigation/AppNavigator.tsx`
  - `src/constants/routes.ts`
  - `src/pages/Home/HomeScreen.tsx`
  - `src/pages/Activity/CreateActivityScreen.tsx`
- **Acceptance criteria:**
  - Users can save profile defaults and see them prefilled during activity creation.
  - Home and profile flows are linked by one-tap navigation.

### Epic V2.1-4: Chat Foundation (Activity + Friends)

- **Goal:** Enable direct friend chat and auto-created activity group chat after finalization.
- **Stories:**
  - Add conversation list and thread screens.
  - Auto-create activity chat from finalized activity.
  - Add direct chat bootstrap for accepted friends.
  - Add unread count and last-read tracking.
- **Schema/API impact:**
  - New tables: `conversations`, `conversation_members`, `messages`.
  - New RPCs: `get_or_create_direct_conversation`, `create_activity_group_conversation`.
  - Realtime subscriptions for `messages`.
- **App impact:**
  - `src/services/chatService.ts`
  - `src/pages/Chat/ChatListScreen.tsx`
  - `src/pages/Chat/ChatThreadScreen.tsx`
  - `src/pages/Friends/FriendsScreen.tsx`
  - `src/pages/Activity/ActivityDetailScreen.tsx`
- **Acceptance criteria:**
  - Finalized activity creates exactly one group conversation.
  - Accepted friends can open a direct chat and exchange realtime messages.

## Validation Focus (Current Sprint)

- Prioritize finishing V2.1 acceptance criteria on device first.
- Defer V3/V4 execution until Phase 3/4/6/7/8 checklists pass.

## V3: Community Growth + Programs

### Epic V3-1: Tournament Creation

- **Goal:** Let users create casual tournaments with inviteable participants.
- **Stories:**
  - Tournament creation form (name, sport, participant cap, start date).
  - Join/leave workflow with host moderation controls.
  - Basic tournament detail screen with roster.
- **Schema/API impact:**
  - `tournaments`, `tournament_participants`.
- **Acceptance criteria:**
  - Host can create and manage tournament participants end-to-end.

### Epic V3-2: Brackets and Scheduling

- **Goal:** Support bracket generation and match progression.
- **Stories:**
  - Generate single-elimination bracket.
  - Match scheduling and result submission.
  - Advance winners automatically.
- **Schema/API impact:**
  - `tournament_matches`, `match_results`.
- **Acceptance criteria:**
  - Bracket progression is deterministic and reproducible.

## V4: Owned Facilities + Membership

### Epic V4-1: Venue Intelligence + Pilot

- **Goal:** Use demand/utilization data to choose viable low-maintenance sports facilities.
- **Stories:**
  - Add city-level demand and utilization metrics.
  - Define pilot selection scoring model.
  - Build partner venue pilot operations checklist.
- **Schema/API impact:**
  - `venue_demand_snapshots`, `city_sport_demand`.
- **Acceptance criteria:**
  - Pilot candidate reports can be generated with objective scoring.

### Epic V4-2: Rally Membership Platform

- **Goal:** Offer one affordable subscription across Rally-managed and partner facilities.
- **Stories:**
  - Membership plans and entitlements model.
  - Access control ledger and usage tracking.
  - Benefit/credit system for user maintenance contributions.
- **Schema/API impact:**
  - `memberships`, `membership_entitlements`, `benefit_ledger`.
- **Acceptance criteria:**
  - Membership status and entitlements can gate product experiences consistently.

### Epic V4-3: Safety + Operations Automation

- **Goal:** Improve safety and low-maintenance operations while preserving privacy and compliance.
- **Stories:**
  - Incident and behavior reporting workflows.
  - Optional access-automation architecture with legal/privacy gates.
  - Operations dashboard for venue health and cost control.
- **Schema/API impact:**
  - `safety_reports`, `operations_events`.
- **Acceptance criteria:**
  - Safety workflows are auditable and policy-compliant.
