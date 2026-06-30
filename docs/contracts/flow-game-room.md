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

### Validator report — tier0-join-loop · 2026-06-27

> Run: 2026-06-27 · branch `fix/tier0-join-loop-builder` @ `30c87e8` · **code audit + live Android** (iOS sim blocked). Live evidence: `docs/product-review/state-matrix-skeptic/2026-06-27/` (non-member + member).

| # | Viewer-state gating row | Result | Notes |
|---|-------------------------|--------|-------|
| 1 | Non-member (live, fixed 2+) → Request to Join only, no Open Game Room | **Pass (code+live)** | `showChat = (canOpenActivityChat ∥ isGroupMember) && isGameMember`. Live: non-member detail = Request to Join only (`01-detail-nonmember.png`) |
| 2 | Approved joiner / host → Open Game Room, never Request to Join | **Pass (code+live)** | `isGameMember = isHost ∥ isApprovedJoiner ∥ isGroupMember`; member Next Up → Game Room chat (`02-member-gameroom.png`). Non-member CTA block gated `!isHost && !isApprovedJoiner` |
| 3 | Entry requires membership, not just `canOpenActivityChat` liveness | **Pass (code)** | `ActivityDetailScreen` L987–988 — liveness AND-ed with `isGameMember` |
| 4 | Matrix: requested/finalized/cancelled rows | **Pass (code, audit)** | Pending excluded from `isGameMember`; finalized member retains room; cancelled blocks per `sessionBlocksResponse`. Live multi-account fixture deferred → CR-T0-4 |

**Invariant check:** "Open Game Room" ⊥ "Request to Join" holds — member never sees Request to Join; non-member never sees Open Game Room.

**Verdict:** PASS (live not-joined + member both sides; pending/finalized/cancelled code-audited, live fixture deferred to CR-T0-4).
