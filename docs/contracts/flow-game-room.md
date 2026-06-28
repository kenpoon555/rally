# Flow — Game room (chat + roster actions)

**Contract id:** `flow-game-room`  
**Status:** Draft — validate before production; **gtm1 adjunct** if groups use Inbox chat  
**Screens:** `ChatThreadScreen`, `GameRoomHeader`, `GameRoomFooter`  
**Related:** [flow-rally-session.md](./flow-rally-session.md) (hub Play tab path — primary GTM 1)  
**Related code:** `src/components/GameRoomActionBar.tsx`, `src/pages/Chat/ChatThreadScreen.tsx`, `src/services/gameCardSessionActions.ts`

## Purpose

Players coordinate in the game room chat: roster strip, I'm in / lock / nudge, join requests, and exit paths — without duplicate action logic or chat regressions.

North-star: **Approved joiner opens game chat → confirms I'm in → host locks roster → chat shows locked state.**

## Demo setup

1. Same seeds as Loop B (`seed-monrovia-basketball-rally-demo`).
2. Host: `marcus@rally-mvrhoops.demo` — open game chat from Rally Play or Activity detail.
3. Member: `@kunyu` — approved on session, not ready.

## Required states

| State | Role | How to reach | Must show |
|-------|------|--------------|-----------|
| **Expanded header** | Both | Open game chat | Court, time, ready count, roster avatars |
| **Collapsed header** | Both | Collapse details | One-line summary; tap to expand |
| **Member I'm in** | Member | Footer actions | Primary I'm in; undo with confirm |
| **Host lock** | Host | All ready per policy | Lock roster enabled; success → finalized strip |
| **Crew join** | Rally member not on roster | Crew game with spots | Join / waitlist CTA |
| **Archived chat** | Post-grace | Past game | Read-only copy + back to chats |

## Viewer-state × visible-actions matrix (T0 · 2026-06-27)

> Added by Tier 0 dogfood triage (`state-matrix-skeptic`): a **non-member** viewing a public fixed game with 2+ players saw **"Open Game Room"** *and* "Request to Join". Root cause: the entry point gated on `canOpenActivityChat`, which reports **chat liveness** (finalized, or fixed + `player_count ≥ 2`), **not viewer membership**. Game Room is a **member surface** — the entry point must require the viewer to actually be on the game.

**Membership = host OR approved joiner OR rally-group member.** `canOpenActivityChat` (liveness) is **necessary but not sufficient** — gate every Game Room entry point with membership too (`isGameMember` in `ActivityDetailScreen`).

| Viewer state | Open Game Room | Request to Join | Confirm / Can't make it | Host ops (lock/nudge/requests) |
|--------------|:--------------:|:---------------:|:-----------------------:|:------------------------------:|
| **Not joined** (no request) | ❌ | ✅ | ❌ | ❌ |
| **Requested** (pending) | ❌ | ❌ (pending state) | ❌ | ❌ |
| **Approved joiner** | ✅ | ❌ | ✅ | ❌ |
| **Host** | ✅ | ❌ | ✅ (host = ready) | ✅ |
| **Finalized** (member) | ✅ (read state) | ❌ | per finalize rules | host only |
| **Cancelled / past** | ❌ (or archived read-only) | ❌ | ❌ | ❌ |

**Invariant:** "Open Game Room" and "Request to Join" are **mutually exclusive** for a given viewer — a member never sees "Request to Join"; a non-member never sees "Open Game Room".

## Pass/fail checklist

### Viewer-state gating (T0)
- [ ] Non-member viewing a live (fixed, 2+ players) game sees **Request to Join** only — **no** "Open Game Room"
- [ ] Approved joiner / host sees **Open Game Room**, **never** "Request to Join"
- [ ] Game Room entry points require membership, not just `canOpenActivityChat` liveness

### Stability
- [ ] No redbox opening game chat from Inbox or detail
- [ ] Realtime join request updates without manual refresh

### Shared session actions
- [ ] Join crew, I'm in, undo, lock, nudge use `gameCardSessionActions` (not duplicated alerts)
- [ ] Lock blocked when roster empty (host alert)

### UX
- [ ] Collapsed bar readable on small screens
- [ ] Game card link opens Activity detail
- [ ] Exit row matches host vs member vs finalized rules

### Tier 6 — Join Loop authoring (taste-tier6 · 2026-06-26)

- [ ] **Player viewport:** status-grouped roster + sticky **Message** — no lock/nudge/need-players/tournament CTAs
- [ ] **Host viewport:** existing ops (lock, nudge, join requests) — unchanged or moved to overflow sheet
- [ ] Tournaments / need-players **out of join loop v1** player path (H-J2 default A)

**Product review:** [taste-tier6 synthesis](../product-review/consolidated/2026-06-26-taste-tier6-synthesis.md)

## Screenshots required

Save to `docs/contracts/screenshots/flow-game-room/`:

1. `01-expanded-header.png`
2. `02-member-im-in.png`
3. `03-host-lock.png`
4. `04-finalized-footer.png`

## Out of scope

- Fill-in suggestions / need-players board (separate contract later)
- Mini-tournament panel

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |

### Validator report — taste-tier6 · 2026-06-26

> Run: 2026-06-26 · branch `fix/taste-tier6-builder` @ `048f2ef` · code audit

| # | Tier 6 checklist row | Result | Notes |
|---|----------------------|--------|-------|
| T1 | Player viewport: grouped roster + Message | **Pass** | `StatusGroupedRoster` in player footer; chat composer = Message surface (game room is chat thread) |
| T2 | Host viewport unchanged | **Pass** | Lock/nudge/join requests remain `isHost`-gated |
| T3 | Tournaments/need-players out of player path | **Pass** | Host-only `showPostNeedPlayers` / `showFillIns`; not rendered for `showPlayerActions` |

**Verdict:** PASS (tier-6 rows).
