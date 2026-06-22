# Flow B — Rally hub → session card → I'm in → lock roster

**Contract id:** `flow-rally-session`  
**Loop:** B (after Loop A passes)  
**Screens:** `RegularsCrewScreen` (Chat / Play / Members), `CrewGameSessionCard`, `ActivityDetailScreen`, Today `NextUpCard` / `MyGameListCard`  
**Related code:** `src/pages/RegularGroup/RegularsCrewScreen.tsx`, `src/components/CrewGameSessionCard.tsx`, `src/components/game/GameListCard.tsx`, `src/components/home/NextUpCard.tsx`

## Purpose

Host and members coordinate one Rally session: see upcoming game, confirm **I'm in**, host **locks roster**. This is the core beta loop from [advisoragent.md](../../../advisoragent.md).

North-star: **Friend in Rally → sees session card → taps I'm in → host locks → locked state visible.**

## Scope vs related contracts

| Path | This contract | Related |
|------|---------------|---------|
| Rally hub Play tab → session card → detail | **In scope** — primary GTM 1 path | — |
| Inbox → game chat → I'm in / lock | **Out of scope** | [flow-game-room.md](./flow-game-room.md) — validate before production or add to gtm1 adjunct |
| Deep link → join Rally | **Out of scope** | [flow-invite-to-rally.md](./flow-invite-to-rally.md) — Loop A |

**GTM 1 (`gtm1-launch-gate`):** hub + Today + detail path required. Game-room path recommended if groups coordinate via Inbox chat.

1. Seeds applied (same as Loop A):
   ```bash
   node scripts/seed-monrovia-basketball-rally-demo.mjs
   supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql
   ```
2. **Host:** `marcus@rally-mvrhoops.demo` — `Julian Fisher Park Regulars` basketball Rally with upcoming session.
3. **Member:** `@kunyu` — approved on upcoming session, not yet ready (or reset `ready_at` to test I'm in).
4. Open hub: Inbox → Rally row **or** Today → Rallies carousel → `Julian Fisher Park Regulars`.

## Required states

| State | Role | How to reach | Must show |
|-------|------|--------------|-----------|
| **Rally hub — Play tab** | Host | RegularsCrew → Play | Upcoming session card, **Create Rally game** CTA if no game |
| **Rally hub — Play tab** | Member | Same | Session card with Join / I'm in / roster state |
| **Empty Play** | Host (no upcoming) | New Rally or completed season | Empty copy + create schedule CTA — no crash |
| **Session card — not ready** | Member on roster | Play tab | **I'm in** (or confirm) action visible |
| **Session card — ready** | Member after I'm in | Tap I'm in | Ready state persists after pull-to-refresh |
| **Session card — host lock** | Host | All required ready (per policy) | **Lock roster** enabled when rules met |
| **Locked session** | Both | After host locks | `finalized` / "Roster locked" on card + detail |
| **Roster full** | Member | Session at capacity | Join blocked or waitlist copy — no crash |
| **Waitlist** | Member | Full session with waitlist enabled | Clear waitlist state if product supports |
| **Today Next Up** | Member with next game | Today tab | Game list card (plain sport icon, **no** status dot) |
| **Game detail** | Member | Tap session card → View game | Who's going inside hero card; manage panel for host only |

## Pass/fail checklist

### Rally hub
- [ ] Chat / Play / Members tabs switch without red screen
- [ ] Rally name + sport visible in header
- [ ] Play tab lists upcoming session(s) for seeded demo
- [ ] Empty Play state renders when no upcoming game (host can schedule)

### Session card (`CrewGameSessionCard`)
- [ ] Court, time, roster seat bar visible
- [ ] Member **Join** only when not on roster; **I'm in** when on roster and not ready
- [ ] **I'm in** writes `ready_at` — verify after refresh
- [ ] Host sees lock readiness hint when applicable
- [ ] **Lock roster** succeeds; non-host cannot lock
- [ ] Locked card shows finalized / locked copy
- [ ] **Roster full:** member sees clear copy (cannot join / waitlist) — no crash
- [ ] **Non-host** cannot lock, cannot access host-only manage actions on detail

### Today alignment (game card UI)
- [ ] Next Up + Also on calendar + Rallies carousel use plain sport icons (no ring)
- [ ] Same card structure as Play list (title, venue, time, spots pill) — signals only on Play discover

### Game detail
- [ ] Who's going row **inside** hero card (not duplicate section at bottom)
- [ ] Avatar tap opens profile when `userId` present
- [ ] Host manage row (Time / Court / Link / Friends) when host tools apply
- [ ] No hooks-after-early-return crash on load

### Android keyboard (if testing Android)
- [ ] Rally chat composer not covered by keyboard (`KeyboardSafeView` on RegularsCrew)
- [ ] Activity detail cost/session note fields visible above keyboard on blur/focus

### Data integrity
- [ ] Lock applies to correct `activity_id` (not another session in same Rally)
- [ ] Today **Next Up** matches the same upcoming session as hub Play tab

## Screenshots required

Save to `docs/contracts/screenshots/flow-rally-session/`:

1. `01-rally-hub-play-host.png` — host Play tab with session
2. `02-rally-hub-play-member.png` — member before I'm in
3. `03-after-im-in.png` — member ready state
4. `04-host-lock-roster.png` — host lock action / readiness
5. `05-roster-locked.png` — both roles see locked state on card
6. `06-today-next-up.png` — Today card (plain icon, no signal)
7. `07-game-detail-whos-going.png` — detail hero with avatar row
8. `08-post-game-attendance-host.png` — host CTA on past locked session (see `flow-post-game-attendance.md`)

### Session card polish (Phase 1.1)

Validated with Loop B — see [module-game-card.md](./module-game-card.md) for preset/shell reference. Detail hero + venue notes validated in **phase2-game-card** sprint.

## Out of scope

- Play discover open games / locked · still welcoming sections
- Mini tournament — [flow-mini-tournament.md](./flow-mini-tournament.md)
- Availability poll — [flow-availability-poll.md](./flow-availability-poll.md)
- Create public pickup game — [flow-create-game.md](./flow-create-game.md)
- Push notifications for join approved
- Inbox → game chat coordination — see [flow-game-room.md](./flow-game-room.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | Tier-2 picky host/member reviews blocked upstream by signed-out auth handoff reliability; re-run once `flow-invite-to-rally` P0 clears | Builder/Validator |

## Validator report

> Run: 2026-06-22 ~01:04 PT · iOS Simulator · `marcus@rally-mvrhoops.demo` · branch `fix/overnight-jun-2026-batch`  
> **Seed note:** Re-seed before I'm-in / lock rows: `./scripts/seed-monrovia-linked.sh` (uses Supabase CLI for service_role — no `.env` key required).

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Hub tabs load | ✅ Pass | Chat / Play / Members switch on Julian Fisher Park Regulars. |
| 2 | Session card member I'm in | N/T | No upcoming session after prior validations; empty Play CTA shown. |
| 3 | Ready persists refresh | N/T | Blocked by row 2 — re-seed required. |
| 4 | Host lock roster | N/T | No live upcoming session to lock. |
| 5 | Locked visible | ✅ Pass | HISTORY cards show `session-card-roster-locked` identifiers. |
| 6 | Today card UI | ✅ Pass | Today quiet-day + YOUR RALLY card (plain sport icon, no status dot). |
| 7 | Game detail who's going | ✅ Pass | Pickup game detail via invite deep link shows WHO'S GOING in hero. |
| 8 | Android keyboard | N/T | iOS sim only. |
| 9 | No redbox | ✅ Pass | Hub + detail load cleanly. |

### Screenshots (`docs/contracts/screenshots/flow-rally-session/`)

- `01-rally-hub-play-host.png`, `05-roster-locked.png`, `06-today-next-up.png`
