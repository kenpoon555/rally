# Flow B — Rally hub → session card → I'm in → lock roster

**Contract id:** `flow-rally-session`  
**Loop:** B (after Loop A passes)  
**Screens:** `RegularsCrewScreen` (Chat / Play / Members), `CrewGameSessionCard`, `ActivityDetailScreen`, Today `NextUpCard` / `MyGameListCard`  
**Related code:** `src/pages/RegularGroup/RegularsCrewScreen.tsx`, `src/components/CrewGameSessionCard.tsx`, `src/components/game/GameListCard.tsx`, `src/components/home/NextUpCard.tsx`

## Purpose

Host and members coordinate one Rally session: see upcoming game, confirm **I'm in**, host **locks roster**. This is the core beta loop from [advisoragent.md](../../../advisoragent.md).

North-star: **Friend in Rally → sees session card → taps I'm in → host locks → locked state visible.**

## Demo setup

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

## Out of scope

- Play discover open games / locked · still welcoming sections
- Mini tournament flows
- Create public pickup game (see future `create-game.md`)
- Push notifications for join approved

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| | | |

## Validator report template

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Hub tabs load | | |
| 2 | Session card member I'm in | | |
| 3 | Ready persists refresh | | |
| 4 | Host lock roster | | |
| 5 | Locked visible | | |
| 6 | Today card UI | | |
| 7 | Game detail who's going | | |
| 8 | Android keyboard (if tested) | | |
| 9 | No redbox | | |
