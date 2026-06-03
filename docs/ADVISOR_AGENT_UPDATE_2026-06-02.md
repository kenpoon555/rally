
# Rally Product Review and Test Plan — 2026-06-02

## 0. Executive Take

The June 2 pivot **makes sense**.

Rally should now be understood as two related products sharing the same app:

1. **Discover one-off games**
- User finds a public game.
- User requests to join.
- Host approves / finalizes.
- Activity-specific chat is acceptable.

2. **Persistent crews**
- Crew identity is primary.
- One crew has one persistent chat.
- Each scheduled game is a session card inside that crew chat.
- Commitment ladder is simple: **Join game → I'm in → Lock roster**.

This is a better product shape than the previous RSVP-heavy model because recurring sports behavior is group-first, not event-first. Real badminton/pickleball groups already have persistent WhatsApp/LINE chats. Rally must compete by adding structure around that persistent group: session cards, roster capacity, attendance, reliability, mini tournaments, and history.

## 1. Product Decision Review

### What Is Correct

- [x] Crew-first chat is the correct model for recurring groups.
- [x] One persistent crew thread prevents inbox duplication.
- [x] Session cards inside the crew thread are easier to understand than many per-game chats.
- [x] Removing RSVP from the core crew flow reduces duplicate intent signals.
- [x] Keeping Discover one-offs separate is correct.
- [x] `Join / I'm in / Lock roster` is clearer than `Going / Maybe / Ready / Finalize`.
- [x] LA badminton + pickleball closed beta remains the right market focus.

### What Needs Tightening

- [ ] User-facing naming must be consistent: choose **Regulars** or **Crew**.
- [ ] The app must clearly explain the difference between a **public game** and a **crew game**.
- [ ] "I'm in" needs a precise meaning: attendance commitment, not casual interest.
- [ ] Announcement model needs a product rule: crew-level, session-level, or both.
- [ ] Attendance/reliability must not become punitive or gameable.
- [ ] Legacy RSVP/per-activity crew conversations need cleanup or hiding.
- [ ] iOS local build reliability must be stabilized before wider beta.

## 2. Recommended Naming

Use **Regulars** for user-facing copy.

Use **crew** internally if code already uses `crew_group`.

Reason:

- "Regulars" feels friendly and sports-native.
- "Crew" is shorter for code and internal model.
- "Team" implies formal competitive structure and should stay later.
- "League" implies public competition and should stay much later.

### User-Facing Terms

| Internal | User-Facing |
|---|---|
| `regular_group` / `crew_group` | Regulars |
| `conversation_type = crew_group` | Regulars chat |
| `conversation_activities` | Sessions |
| Activity inside crew | Game session |
| `ready_at` | I'm in |
| Finalized roster | Locked roster |
| Public activity | Public game |

## 3. Current Product Model

### Public Game Flow

```text
Discover
-> View public game
-> Request to join
-> Host approves
-> Game Room
-> Host locks/finalizes roster
-> Play
-> Attendance/review
```

### Regulars Flow

```text
Regulars group
-> Persistent group chat
-> Host schedules session
-> Session card appears in same chat
-> Members join session
-> Members tap "I'm in"
-> Host locks roster
-> Play
-> Attendance/reliability
-> Schedule next session
```

### Product Rule

Public games are for discovery.

Regulars are for repeat play.

Mini tournaments are for engagement inside Regulars.

Teams and Leagues are later formalization layers.

## 4. End Goal

Rally should become:

> The easiest way for local players to form reliable sports groups, run recurring games, and build lightweight competitive culture.

The end state should have four layers:

1. **Find**
- Discover public games.
- Find players.
- Join open spots.
2. **Repeat**
- Regulars groups.
- Persistent chat.
- Session cards.
- Join / I'm in / Lock roster.
3. **Trust**
- Attendance.
- No-show detection.
- Reliability score.
- Host controls.
4. **Compete**
- Mini tournaments inside Regulars.
- Score history.
- Internal leaderboards.
- Later: teams, hosted seasons, external leagues.

## 5. Recommended Updates

## 5.1 Must Do Now

- [ ] Pick final copy: use **Regulars** in UI, not "Crew."
- [ ] Make Dynamic Home the main post-login screen.
- [ ] Add cards for:
- Next Up
- Active Regulars
- Session needing commitment
- Host next game
- Public games near you
- [ ] Make Regulars chat show session cards above or inside the message stream.
- [ ] Make "I'm in" visibly stronger than joining.
- [ ] Add clear locked roster state.
- [ ] Ensure public one-off games still work unchanged.
- [ ] Add migration/data cleanup plan for old per-activity crew chats.
- [ ] Stabilize iOS clean build.

## 5.2 Should Do Soon

- [ ] Add session-level announcements while preserving crew-level announcement.
- [ ] Add waitlist behavior when session is full.
- [ ] Add attendance prompt after session end.
- [ ] Add reliability calculation v1.
- [ ] Add host summary dashboard.
- [ ] Add "Bring Rally to your group" CTA.
- [ ] Add LA badminton/pickleball beta copy.
- [ ] Add Founding Member benefits copy.

## 5.3 Delay

- [ ] Full Teams.
- [ ] Full Leagues.
- [ ] Payments / fee split.
- [ ] Media chat.
- [ ] City expansion outside LA.
- [ ] Public rankings.
- [ ] Complex tournament brackets.

## 6. UI Screen Review

## 6.1 Dynamic Home

### Purpose

Show the user's next best action.

### Empty / New User

```text
┌─────────────────────────────┐
│ Rally Beta                  │
│ LA Badminton + Pickleball   │
│                             │
│ Ready to play this week?    │
│                             │
│ [ Find a Game ]             │
│ [ Host a Game ]             │
│ [ Create Regulars ]         │
│                             │
│ Bring Rally to your group   │
│ or city?                    │
│ [ Contact us ]              │
└─────────────────────────────┘
```

### Active Player

```text
┌─────────────────────────────┐
│ Home                        │
│                             │
│ Next Up                     │
│ Badminton · Thu 7:30 PM     │
│ Roster: 6/8 · You are in    │
│ [ Open Regulars Chat ]      │
│                             │
│ Needs Your Commitment       │
│ Pickleball · Sat 10 AM      │
│ [ Join ] [ I'm in ]         │
│                             │
│ Games Near You              │
│ [ View Discover ]           │
└─────────────────────────────┘
```

### Host

```text
┌─────────────────────────────┐
│ Home                        │
│                             │
│ Your Regulars               │
│ Pasadena Badminton          │
│ 42 members · next game Thu  │
│ [ Schedule Next Game ]      │
│                             │
│ Roster To Lock              │
│ Thu 7:30 PM · 7/8 in        │
│ [ Lock Roster ]             │
│                             │
│ Invite players              │
│ [ Share Regulars Link ]     │
└─────────────────────────────┘
```

### Checklist

- [ ] New user sees clear LA beta positioning.
- [ ] User with upcoming game sees Next Up.
- [ ] User in Regulars sees relevant session card.
- [ ] Host sees schedule/lock actions.
- [ ] No duplicate crew/game rows.
- [ ] Tapping each card routes to expected screen.

## 6.2 Discover

### Purpose

Public game discovery, not recurring group management.

```text
┌─────────────────────────────┐
│ Discover                    │
│ Badminton · Pickleball      │
│                             │
│ Tonight near LA             │
│                             │
│ ┌─────────────────────────┐ │
│ │ Badminton · 7:30 PM     │ │
│ │ 2 spots open · $8/pers… │ │
│ │ Intermediate · 3.2 mi   │ │
│ │ [ View Game ]           │ │
│ └─────────────────────────┘ │
│                             │
│ No games?                   │
│ [ Host a Game ]             │
└─────────────────────────────┘
```

### Checklist

- [ ] Public games appear.
- [ ] Crew-only sessions do not incorrectly appear as public games unless intended.
- [ ] Empty state pushes hosting.
- [ ] Filters work for badminton/pickleball.
- [ ] Join request flow still works.

## 6.3 Host / Create Game

### Purpose

Create either a public game or a Regulars session.

```text
┌─────────────────────────────┐
│ Host a Game                 │
│                             │
│ Who is this for?            │
│ [ Public game ]             │
│ [ My Regulars ]             │
│                             │
│ Sport                       │
│ [ Badminton ▼ ]             │
│                             │
│ When                        │
│ [ Thu 7:30 PM ]             │
│                             │
│ Spots                       │
│ [ 8 ]                       │
│                             │
│ Cost note                   │
│ [ ~$8/person court ]        │
│                             │
│ [ Create ]                  │
└─────────────────────────────┘
```

### Checklist

- [ ] Public game creates public activity.
- [ ] Regulars session links to existing crew conversation.
- [ ] Cost note saves.
- [ ] Capacity saves.
- [ ] Sport saves.
- [ ] Created session card appears in persistent Regulars chat.

## 6.4 Activity Detail / Session Detail

### Purpose

Show one game/session details and roster state.

```text
┌─────────────────────────────┐
│ Badminton Session           │
│ Thu 7:30 PM · Court 3       │
│                             │
│ Regulars                    │
│ Pasadena Badminton          │
│                             │
│ Roster                      │
│ 6 / 8 joined                │
│ 5 marked "I'm in"           │
│                             │
│ Cost                        │
│ ~$8/person court            │
│                             │
│ [ Join Game ]               │
│ [ I'm in ]                  │
│ [ Open Chat ]               │
└─────────────────────────────┘
```

### Host View

```text
[ Edit session ]
[ Pin session note ]
[ Lock roster ]
[ Schedule next session ]
```

### Checklist

- [ ] Public activity detail shows join request.
- [ ] Regulars session detail shows Join / I'm in.
- [ ] Host sees lock roster.
- [ ] Non-host cannot lock roster.
- [ ] Full session blocks direct join or moves user to waitlist.
- [ ] Locked roster prevents accidental state changes.

## 6.5 Regulars Chat

### Purpose

Persistent group home.

```text
┌─────────────────────────────┐
│ Pasadena Badminton          │
│ 42 Regulars                 │
│                             │
│ Pinned                      │
│ Court 3 this week           │
│                             │
│ Upcoming Sessions           │
│ ┌─────────────────────────┐ │
│ │ Thu 7:30 PM · 6/8       │ │
│ │ You: I'm in             │ │
│ │ [ View ] [ Share ]      │ │
│ └─────────────────────────┘ │
│                             │
│ Ken: I booked Court 3       │
│ Amy: I can bring shuttles   │
│                             │
│ Message...                  │
└─────────────────────────────┘
```

### Checklist

- [ ] One Regulars group equals one chat row.
- [ ] Multiple sessions appear inside same thread.
- [ ] New session does not create duplicate inbox row.
- [ ] Session card routes to session detail.
- [ ] System messages include scheduled/locked events.
- [ ] Pinned announcement works.
- [ ] Message send works.

## 6.6 Chats Inbox

### Purpose

Show conversations without duplication.

```text
┌─────────────────────────────┐
│ Chats                       │
│                             │
│ Next Up                     │
│ Badminton Thu · 7:30 PM     │
│ [ Open ]                    │
│                             │
│ Regulars                    │
│ Pasadena Badminton          │
│ Court 3 this week           │
│                             │
│ Direct Messages             │
│ Amy                         │
│ See you Thursday            │
└─────────────────────────────┘
```

### Checklist

- [ ] Regulars row appears once.
- [ ] Public game room appears separately.
- [ ] Direct messages still appear.
- [ ] Preview text is correct.
- [ ] Unread count works.
- [ ] No old per-activity crew chats visible.

## 6.7 Regulars Profile / Group Home

### Purpose

Manage members, games, and history.

```text
┌─────────────────────────────┐
│ Pasadena Badminton          │
│ 42 Regulars                 │
│                             │
│ Sports                      │
│ Badminton · Pickleball      │
│                             │
│ Next Session                │
│ Thu 7:30 PM · 6/8           │
│ [ Open ]                    │
│                             │
│ Members                     │
│ Ken · host                  │
│ Amy · reliable              │
│ David · reliable            │
│                             │
│ [ Schedule Game ]           │
│ [ Invite Members ]          │
│ [ Create Mini Tournament ]  │
└─────────────────────────────┘
```

### Checklist

- [ ] Member list loads.
- [ ] Host controls are gated.
- [ ] Invite link works.
- [ ] Supported sports are visible.
- [ ] Multi-sport session creation works.
- [ ] Mini tournament CTA exists but can be disabled until built.

## 6.8 Post-Game Attendance

### Purpose

Create trust signal.

```text
┌─────────────────────────────┐
│ Did the game happen?        │
│                             │
│ Badminton · Thu 7:30 PM     │
│                             │
│ Who showed up?              │
│ [✓] Ken                     │
│ [✓] Amy                     │
│ [ ] David                   │
│                             │
│ Quick feedback              │
│ [Good teammate]             │
│ [On time]                   │
│ [Friendly]                  │
│                             │
│ [ Submit ]                  │
└─────────────────────────────┘
```

### Checklist

- [ ] Prompt appears after session end.
- [ ] Host can submit attendance.
- [ ] Players can confirm game happened.
- [ ] No-show is not publicly shamed.
- [ ] Reliability updates after enough confidence.
- [ ] User can dispute later if needed.

## 6.9 Admin / Safety

### Purpose

Manual control during beta.

```text
┌─────────────────────────────┐
│ Admin                       │
│                             │
│ Reports                     │
│ 3 open                      │
│                             │
│ Users                       │
│ Search username/email       │
│                             │
│ Actions                     │
│ [ Suspend User ]            │
│ [ Close Report ]            │
│ [ View Context ]            │
└─────────────────────────────┘
```

### Checklist

- [ ] Report user works from profile/chat.
- [ ] Admin sees report.
- [ ] Admin can suspend.
- [ ] Suspended user loses access.
- [ ] Closing report records resolution.

## 7. Product Semantics Needing Final Decisions

## 7.1 "I'm in"

Recommended meaning:

> "I commit to showing up if I am on the final roster."

Rules:

- Joining claims a tentative roster slot.
- "I'm in" confirms commitment.
- Host locking roster converts committed players into final roster.
- If user taps "I'm in" then no-shows, reliability can be affected.
- If user only joined but never tapped "I'm in", penalty should be softer.

## 7.2 Announcements

Recommended model:

- **Crew-level pinned announcement**: persistent group info.
- **Session-level note**: specific to one game.
Example:

- Crew announcement: "We usually play Thursdays at Pasadena."
- Session note: "Court 3, bring cash, $8/person."
Do not force one announcement field to do both jobs.

## 7.3 Attendance Score v1

Recommended formula:

```text
Reliability = confirmed_attended / committed_sessions
```

Where `committed_sessions` means:

- Player tapped "I'm in", and
- Roster was locked, and
- Game was not cancelled.
Do not count:

- Host-cancelled games.
- Weather/venue cancellation.
- User left before lock.
- User was waitlisted.
Use confidence bands:

- Under 3 games: "New player"
- 3-9 games: show soft label
- 10+ games: show percentage

## 7.4 Legacy Cleanup

Policy:

- Hide legacy per-activity crew chats from inbox.
- Keep messages in DB for audit/history.
- Route old session links to the new crew conversation where possible.
- Do not delete data until beta is stable.

## 8. Route / Scenario Test Checklist

## 8.1 Auth and Onboarding

- [ ] Fresh install opens welcome/login.
- [ ] Signup works.
- [ ] Login works.
- [ ] Logout works.
- [ ] User can set sport preference.
- [ ] User can set LA/pickleball/badminton preference.
- [ ] App recovers after force close.

## 8.2 Dynamic Home

- [ ] New user with no games sees Discover/Host CTA.
- [ ] User with upcoming public game sees Next Up.
- [ ] User with Regulars session sees session card.
- [ ] Host with Regulars sees Schedule Next Game.
- [ ] Locked roster state appears.
- [ ] Tapping cards routes correctly.

## 8.3 Discover One-Off

- [ ] Create public game as Host A.
- [ ] Discover public game as User B.
- [ ] User B requests to join.
- [ ] Host A approves.
- [ ] Activity-specific chat opens.
- [ ] Host locks/finalizes roster.
- [ ] Post-game review/attendance prompt appears.

## 8.4 Regulars Creation

- [ ] Create Regulars from successful game.
- [ ] Invite previous players.
- [ ] Invite link opens correct flow.
- [ ] New member joins Regulars.
- [ ] Regulars chat is created once.
- [ ] Member appears in member list.

## 8.5 Regulars Session Scheduling

- [ ] Host schedules next game from Regulars.
- [ ] Session links into existing crew chat.
- [ ] No new duplicate conversation is created.
- [ ] Session card appears in chat.
- [ ] Session appears on Home.
- [ ] Session detail opens.

## 8.6 Join / I'm In / Lock Roster

- [ ] Member joins crew session.
- [ ] Capacity count increments.
- [ ] Member taps "I'm in."
- [ ] `ready_at` / commitment state persists after refresh.
- [ ] Host locks roster.
- [ ] Non-host cannot lock roster.
- [ ] Locked roster state persists.
- [ ] Full session blocks additional joins or shows waitlist.

## 8.7 Multi-Session Same Crew

- [ ] Host schedules two future sessions.
- [ ] Both appear in same Regulars chat.
- [ ] Home chooses correct Next Up session.
- [ ] Session actions apply to correct session only.
- [ ] Announcement/note does not bleed into wrong session.
- [ ] Inbox still shows one Regulars row.

## 8.8 Announcements

- [ ] Host sets crew announcement.
- [ ] Members see crew announcement.
- [ ] Non-host cannot edit crew announcement.
- [ ] Host sets session note if implemented.
- [ ] Session note displays only on that session.

## 8.9 Inbox

- [ ] Direct message row works.
- [ ] Public game chat row works.
- [ ] Regulars group chat row works.
- [ ] No duplicate session rows for same Regulars group.
- [ ] Latest message preview works.
- [ ] System message preview works.
- [ ] Unread state works.

## 8.10 Push Notifications

Physical devices required.

- [ ] Join request push.
- [ ] Approval push.
- [ ] Regulars session scheduled push.
- [ ] "I'm in" / roster update push if implemented.
- [ ] Lock roster push.
- [ ] Chat message push.
- [ ] Push tap opens correct screen.

## 8.11 Admin / Safety

- [ ] User reports another user.
- [ ] Admin sees report.
- [ ] Admin suspends user.
- [ ] Suspended user cannot interact.
- [ ] Admin closes report.
- [ ] Blocked user cannot message blocker.

## 8.12 iOS / Android Runtime

- [ ] Android emulator install.
- [ ] Android physical device install if available.
- [ ] iOS simulator launch after clean reboot.
- [ ] iOS local build clean after deleting stale process locks.
- [ ] iOS preview/ad hoc build installs on registered devices.
- [ ] No dev diagnostic panels in preview.
- [ ] App icon/splash render correctly.

## 8.13 Database / RLS

- [ ] Migrations through latest are applied on preview.
- [ ] `ensure_crew_conversation` works for group member.
- [ ] `schedule_group_next_game` links to crew thread.
- [ ] `join_crew_game` enforces capacity.
- [ ] Non-member cannot access private Regulars chat.
- [ ] Member can access Regulars chat.
- [ ] Host-only RPCs reject non-host.
- [ ] Roster count sync trigger is correct.

## 9. Recommended Next Build Order

### Step 1: Stabilize

- [ ] Clean Android run.
- [ ] Clean iOS run.
- [ ] Confirm preview branch/build.
- [ ] Confirm migrations.
- [ ] Hide diagnostics.

### Step 2: Validate Crew Pivot

- [ ] One crew, one chat.
- [ ] Multiple sessions in same chat.
- [ ] Join / I'm in / Lock roster.
- [ ] Discover one-off still works.

### Step 3: Fix Semantics

- [ ] Decide Regulars vs Crew copy.
- [ ] Define "I'm in."
- [ ] Define announcements.
- [ ] Define attendance formula.

### Step 4: Add Beta Polish

- [ ] Dynamic Home.
- [ ] LA badminton/pickleball copy.
- [ ] Founder benefits copy.
- [ ] Host/partner CTA.
- [ ] Better empty states.

### Step 5: Add Retention

- [ ] Post-game attendance.
- [ ] Reliability v1.
- [ ] Schedule next game nudge.
- [ ] Host summary.

### Step 6: Mini Tournament MVP

Only after crew session loop works.

- [ ] Create mini tournament in Regulars.
- [ ] Doubles round robin.
- [ ] Join tournament.
- [ ] Manual score entry.
- [ ] Internal leaderboard.

## 10. Final Recommendation

The pivot should stay.

The current priority should be:

```text
Stabilize runtime
-> Validate crew-first session flow
-> Finalize product semantics
-> Add Dynamic Home
-> Add attendance/reliability
-> Then build mini tournaments
```

Do not start full Teams, full Leagues, payments, or external city expansion until the crew-first weekly loop is proven with real LA badminton/pickleball users.
