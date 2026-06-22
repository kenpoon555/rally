# Flow — Create game

**Contract id:** `flow-create-game`  
**Status:** Active — Jun 2026 feedback sprint  
**Screens:** `CreateActivityScreen`, `CreateRallyGameSheet` (Rally path)  
**Related code:** `src/pages/Activity/CreateActivityScreen.tsx`, `src/components/rally/CreateRallyGameSheet.tsx`, `src/components/ScheduleDateTimePicker.tsx`, `src/services/activityService.ts`, `src/services/inviteLinkService.ts`

**Sport/mode matrix:** [module-sport-game-modes.md](./module-sport-game-modes.md)

## Purpose

Host creates a pickup or Rally session with valid schedule, court, roster size, and shareable host invite on success.

North-star: **Host completes form → game exists → host invite share works (Loop A game path).**

## Create surfaces (do not conflate)

| Surface | Route | Use |
|---------|-------|-----|
| **Public pickup** | `CreateActivityScreen` (no `regular_group_id`) | Discover / Play open games |
| **Rally session** | `CreateRallyGameSheet` from Rally hub | Crew pickup or mini tournament |
| **Coach class** | `CreateActivityScreen` `createMode: 'class'` | Coach class/clinic — **must** publish `coach_class_listings` + parent enroll share — **not** pickup `createActivity` |

## Demo setup

1. Log in as `marcus@rally-mvrhoops.demo`.
2. **Public:** Play → create game (or Host tab if enabled).
3. **Rally:** Inbox → Rally → Play tab → Create game.
4. Use Monrovia demo court when testing basketball.

## Required states

| State | How to reach | Must show |
|-------|--------------|-----------|
| **Empty form** | Open create | Sport, time, court pickers; no crash |
| **iOS schedule spinner** | Create → **When** section | Spinner shows **date + time** labels; wheels scroll; selected time in `fieldMeta` below |
| **Android schedule** | Create → When | "Change date & time" → date then time dialogs |
| **Validation errors** | Submit incomplete | Inline or alert errors — no silent fail |
| **Pickup create success** | Public pickup flow | Lands on detail or share prompt |
| **Rally session create** | From RegularsCrew | Tied to `regular_group_id`; appears on Play tab |
| **Share after create** | Post-create CTA | Host invite URL via `shareGameInvite(..., { asHost: true })` |

## Pass/fail checklist

### Schedule picker (P0 — Jun 2026)

- [ ] **iOS:** `ScheduleDateTimePicker` spinner visible (not blank white box while "rolling")
- [ ] **iOS:** Selected datetime reflected in formatted text below picker (`fieldMeta`)
- [ ] **iOS:** `minuteInterval` snapping (30 min) updates displayed time
- [ ] **Android:** Date → time sequential picker completes without crash
- [ ] Schedule in future — past time blocked on submit

### Coach class publish (P1 — tier 2 picky · B8 shipped PR #47)

- [x] `createMode: 'class'` publish creates **`coach_class_listings`** row (not pickup-only `activities` path) — DB proof `@playerr0474532`
- [ ] Post-publish lands on **`ClassDetail`** with **Share parent enrollment invite** (`class-enroll` link) — **tier 3:** sim screenshot required
- [x] Post-publish does **not** show **Pickup game** card + host **Copy link** as primary outcome (code path)
- [x] Non-Marcus approved coach (`is_coach=true`) can complete without demo seed classes — listing insert verified

### Form & create

- [ ] Auth handoff from signed-out invite/login is reliable; host can reach create surface without dead-end
- [ ] Schedule picker respects timezone / duration
- [ ] Court search returns seeded locations
- [ ] Roster min/max saved correctly
- [ ] Created activity has `invite_token`
- [ ] Share sheet message uses `inviteLinkService` (no inline URLs)
- [ ] Android keyboard does not hide primary CTA

### Sport modes (see module-sport-game-modes)

- [ ] Basketball Rally: pickup only
- [ ] Badminton Rally: pickup + mini tournament when configured

## Screenshots required

`docs/contracts/screenshots/flow-create-game/`

| File | State |
|------|-------|
| `01-ios-schedule-spinner-visible.png` | When section — wheels readable |
| `02-form-validation.png` | Validation error |
| `03-create-success-share.png` | Post-create share |

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | Tier-2 picky host personas could not reach create flows reliably due shared auth handoff blocker; re-run after invite/auth fix | Builder/Validator |
| 2026-06-22 | ~~B8 pickup path~~ — **resolved** PR #47; tier 3: sim ClassDetail share screenshot for `@playerr0474532` | Validator V1 |
| 2026-06-21 | iOS create game: schedule spinner rolls but date/time not visible | Fixer |
| — | Not fully validated on device | Validator |

## Out of scope

- Recurring series / season templates
- Payment collection
- Calendar month grid UI (uses native spinner, not rolling month calendar)

## Related

- [module-sport-game-modes.md](./module-sport-game-modes.md)
- [flow-invite-to-rally.md](./flow-invite-to-rally.md) — game invite path
- [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md) — Create Class path
