# Module — Sport templates & game modes

**Contract id:** `module-sport-game-modes`  
**Status:** Active — documents config matrix (Jun 2026)  
**Related code:** `src/constants/sports.ts`, `src/constants/gameModes.ts`, `src/services/sportTemplateService.ts`, `CreateRallyGameSheet.tsx`, `CreateActivityScreen.tsx`

## Purpose

Each sport exposes the **correct create modes** (pickup vs mini tournament vs class) from config — not hardcoded per screen.

North-star: **Basketball Rally create shows Pickup only; Badminton Rally shows Pickup + Mini tournament when template allows.**

## Config layers (read order)

| Layer | File | Controls |
|-------|------|----------|
| **Sport metadata** | `src/constants/sports.ts` → `SPORT_METADATA` | `miniTournamentEnabled`, roster defaults, `launchEnabled` |
| **DB sport template** | `sport_templates` via `sportTemplateService` | `tourney_formats[]`, `default_duration_minutes`, listing hints |
| **Game mode resolver** | `src/constants/gameModes.ts` → `resolveGameModesForSport()` | Merges template + metadata into mode chips |
| **Create surfaces** | `CreateRallyGameSheet` (Rally hub) · `CreateActivityScreen` (public pickup / class) | Which UI shows which modes |

## Mode matrix (v1 — expected behavior)

| Sport | Public Create Game (Discover) | Rally → Create game | Class create (coach) |
|-------|------------------------------|---------------------|----------------------|
| **Basketball** | Pickup only | **Pickup only** (`miniTournamentEnabled: false`) | Class/clinic (coach flag) |
| **Badminton** | Pickup | Pickup + Mini tournament (if template or default) | Class/clinic |
| **Pickleball** | Pickup | Pickup + Mini tournament | Class/clinic |
| **Volleyball** | Pickup | Pickup + Mini tournament | Class/clinic |
| **Running** | Pickup (meetup location) | Pickup only | Class/clinic optional |
| **Workout** | Pickup (meetup location) | Pickup only | Prefer coach Class for bootcamp |

**Meetup sports (non-court):** See [module-sport-meetup-sports.md](./module-sport-meetup-sports.md) — Running + Workout use ballpark meet area, not court picker.

**Human gate H1:** Basketball mini tournament in Rally — **off for v1** (full-court pickup runs only). Revisit when bracket UX exists.

## Entry points (where modes appear)

| User action | Screen | Modes shown |
|-------------|--------|-------------|
| Play → create public game | `CreateActivityScreen` | Pickup session (no Rally `regular_group_id`) |
| Rally hub → Create game | `CreateRallyGameSheet` | `resolveGameModesForSport(rally.sport_type)` |
| Profile → Coach Tools → Create Class | `CreateActivityScreen` `createMode: 'class'` | Class/clinic form — not pickup/tournament chips |
| Coach + non-coach | `CreateRolePickerSheet` | Coach sees **Class/Clinic** option when `userIsCoach` |

## Pass/fail checklist

- [ ] Basketball Rally create: **only** "Pickup session" chip — no mini tournament
- [ ] Badminton Rally create: Pickup + Mini tournament when `sportSupportsMiniTournament` true
- [ ] Public Create Game: pickup flow — no tournament chip on CreateActivityScreen
- [ ] Mode selection changes form (tournament hides When/Where/roster steppers)
- [ ] `getSportRosterDefaults(basketball)` applied on create (min/max steppers)
- [ ] Sport template DB override: if `tourney_formats` empty, metadata fallback applies

## Screenshots required

`docs/contracts/screenshots/module-sport-game-modes/`

| File | State |
|------|-------|
| `01-rally-basketball-pickup-only.png` | Basketball Rally create — single mode |
| `02-rally-badminton-two-modes.png` | Badminton — Pickup + Mini tournament |
| `03-public-create-pickup.png` | Discover create — no tournament |

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-21 | User reported basketball Rally only pickup — **confirm intended** vs bug | Product |

## Out of scope

- League / season templates
- Multi-day tournaments
- Sport-specific class pricing

## Related

- [flow-create-game.md](./flow-create-game.md) — schedule picker + create form
- [flow-mini-tournament.md](./flow-mini-tournament.md) — bracket flow
- [module-coach-parent-navigation.md](./module-coach-parent-navigation.md) — Create Class entry
