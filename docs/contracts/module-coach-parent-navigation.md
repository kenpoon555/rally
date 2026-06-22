# Module contract — Coach / parent navigation & entrances

**Contract id:** `module-coach-parent-navigation`  
**Status:** **Green** — validation 2026-06-22: cross-contract sim proof (B2/B3/B4) on flags-on build  
**Product review:** [2026-06-21-onboarding-synthesis.md](../product-review/consolidated/2026-06-21-onboarding-synthesis.md) · tier 3: [2026-06-22-onboarding-expert-synthesis.md](../product-review/consolidated/2026-06-22-onboarding-expert-synthesis.md)  
**UI ideas:** [parent-student-coach-ui-ideas.md](../coach-parent-student/parent-student-coach-ui-ideas.md)  
**Safety:** [parent-student-coach-safety-design.md](../coach-parent-student/parent-student-coach-safety-design.md)  
**Related code:** `HomeScreen.tsx`, `ProfileScreen`, `DynamicHomeScreen.tsx`, `RegularsCrewScreen.tsx`, `coachParentService.ts`, Inbox

## Purpose

Role-based coach/parent surfaces **inside existing tabs** — no 5th tab, no bolt-on module app.

North-star:

```text
Profile = setup (Family section + Coach Tools section)
Today / Rally hub = ongoing classes & schedules
Inbox = announcements & enrollment
Play = discover (Classes segment) + light next-action cards only
```

**Market sizing:** Niche but profitable — sections on Profile are **real sections with cards**, not a new tab. Play stays discovery-first.

## Tab map (app tabs today)

| Tab | Code / screen | Coach/parent use |
|-----|---------------|------------------|
| **Today** | `DynamicHomeScreen` | My Classes summary; Coach today card (optional) |
| **Play** | `HomeScreen` | Games \| Players \| **Classes** (sport-filtered) |
| **Inbox** | Inbox filters | Class announcements, cancel/defer, enroll requests |
| **Profile** | `ProfileScreen` | **Family** section · **Coach Tools** section (role-gated) |

`Rallys` = Rally groups → `RegularsCrew` hub (from Today carousel / Inbox). Class Rally reuses hub + detail pattern.

## Profile — Family section (v1.2)

**Agreed:** Family lives as a **Profile section** (not a separate app area).

| State | Must show |
|-------|-----------|
| **Section header** | **Family** — visible when `PARENT_FAMILY_UI` **and** adult parent intent, **including zero children** (R1 locked) |
| **Family Profiles row/card** | Subtitle: *Manage child/student profiles for classes* |
| **List push** | Per-child rows: nickname · active class summary |
| **Add Child Profile** | Lime CTA on list screen |
| **Parent Settings / Consent** | Links to [flow-parent-guardian-consent.md](./flow-parent-guardian-consent.md) |
| **Privacy** | *Private — only you and enrolled coaches* |
| **Hidden for non-parents** | No Family section for R0 players, teens, or flag-off builds |
| **Empty state (zero children)** | Section visible with empty copy + Add Child path — not hidden until first child |

Parent + coach users see **both** Family and Coach Tools sections when each role gate passes.

**Reference dual-role demo:** `marcus@rally-mvrhoops.demo` (Marcus) is the seeded dual-role reference — Family + Coach Tools both visible. Validator must also test **fresh accounts** without Marcus user-id hardcode in `shouldShowFamilySection` / `userIsCoach` (B6).

## Profile — Coach Tools section (v1.1)

| State | Must show |
|-------|-----------|
| **Section header** | **Coach Tools** — only if adult + `coach` role / Founding Coach |
| **Teen accounts** | **Never** — force-hide when `age_category = teen_13_17` regardless of `is_coach` (R3 locked) — [flow-teen-account-onboarding.md](./flow-teen-account-onboarding.md) |
| **Become a coach** | **Not in v1** — no self-serve apply; admin/seed sets `is_coach` — [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md) |
| **Coach Profile** | Sport, area, edit |
| **Payment link / note** | External link text only v1 |
| **Class Templates** | Optional v1.1 — or defer to Create flow |
| **Create Class** | Entry to class Rally create (coach create flow) |
| **Absent for non-coaches** | Entire section hidden — no upsell hero |

## Today / Rally hub — ongoing classes

| State | Surface | Must show |
|-------|---------|-----------|
| **Parent My Classes** | Today block | Per-child upcoming classes — **only** adult parent with children or active enrollments |
| **Coach Classes I teach** | Today block or hub Play tab | Today's class, enrolled/confirmed counts — adult coach only; **never** for teens |
| **Class detail** | Rally-style screen | Tabs: Overview · Schedule · Roster · Chat |
| **Empty parent (zero children)** | Profile Family CTA | *Manage classes for your child* → Profile Family — **not** MY CLASSES card with parent copy on Today |
| **Empty coach** | Coach Tools CTA | *Create your first class* |
| **R0 / teen / coach zero-child** | Today | **No** MY CLASSES block — see B4 rule below |

**MY CLASSES visibility rule (B4):** Show when adult + (`studentCount > 0` OR explicit parent intent OR active enrollments). Hide for R0 players, teens (`teen_13_17`), and coaches with zero children. Cross-ref [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md).

**Dual-role scroll density (P3):** Parent + coach users may see Family section, Coach Tools, and both Today cards — acceptable for v1; note density in Validator notes if Today feels crowded.

Contracts: [flow-coach-minor-class-roster.md](./flow-coach-minor-class-roster.md) · [flow-student-class-enrollment.md](./flow-student-class-enrollment.md)

## Play — Classes segment (v1.1)

Third pill: **Games | Players | Classes**. **Sport filter required** (same as Games).

| State | Must show |
|-------|-----------|
| **Classes list** | `GameCardShell` + `classDiscover` preset |
| **Sport sync** | Basketball filter → basketball classes only |
| **Empty** | *No {sport} classes nearby* |
| **Light cards** | Next class (parent) / Coach today — **only if user has class context** |
| **No admin on Play** | No roster edit, no Family setup on Play main feed |

Preset: `classDiscover` in `gameCardLayouts.ts`.

## Inbox — announcements (v1.3+)

| State | Must show |
|-------|-----------|
| **Parent** | Coach/class announcement threads |
| **Coach** | Parent replies, can't-make-it, enrollment |
| **No child DM** | Coach → parent/guardian only — [module-student-visibility.md](./module-student-visibility.md) |

## Create flow — role-based options

| Role | Create sheet options |
|------|---------------------|
| Normal | Casual Game · Rally Group |
| Coach (adult only) | + **Class / Clinic** |
| Teen (`teen_13_17`) | Casual Game · Rally Group only — **no** Class/Clinic even if `is_coach` set in DB |
| Venue admin (later) | + Venue Open Play |

Only show extra options when role permits. Teen age gate on Create flow: see [flow-teen-account-onboarding.md](./flow-teen-account-onboarding.md) H2 probe.

## Class session card variant

Reuse `CrewGameSessionCard` / session preset with class labels:

| Viewer | Shows |
|--------|-------|
| Parent | Child name · Confirmed/Not responded · fee note · Confirm / Can't make it |
| Coach | Enrolled · confirmed counts · Roster / Message / Nudge / Cancel |

Preset: extend `rallySession` or add `classSession` when implementing — update `module-game-card.md`.

## Deep links

| Link | Lands on |
|------|----------|
| Parent class invite | Child profile picker → enroll — [flow-student-class-enrollment.md](./flow-student-class-enrollment.md) |
| Adult class share | Class detail (18+ discover) |

## Feature flags

| Flag | Default | Enables |
|------|---------|---------|
| `COACH_CLASSES_DISCOVER` | `false` | Play → Classes segment |
| `PARENT_FAMILY_UI` | `false` | Profile → Family section |
| `COACH_DASHBOARD` | `false` | Profile → Coach Tools section |
| `CLASS_INBOX_ANNOUNCE` | `false` | Inbox announcement threads |

GTM 1: **all off** — store build must pass **flag-off** checklist below.

## Validation modes

| Mode | Flags | When |
|------|-------|------|
| **Production default** | All CPS flags `false` | App Store / Play v1.0 adult beta |
| **Validation / pilot** | Flags `true` in sim only | `v1.1`–`v1.3` contract validation |

Do not mark navigation green on flags-on run alone — **both modes** must pass before CPS pilot.

## Pass/fail checklist

### Flag-off — production store build (GTM 1 required)

- [ ] With all CPS flags `false`: **no** Family section on Profile
- [ ] With all CPS flags `false`: **no** Coach Tools section (even if user has coach role in DB)
- [ ] With all CPS flags `false`: Play shows **Games | Players** only — no Classes pill
- [ ] With all CPS flags `false`: no My Classes / Coach today cards on Today
- [ ] Class enroll deep link does **not** create student profile or show child picker when flags off
- [ ] No minor-identifying data visible anywhere in app

### Flag-on — validation / pilot (`v1.1`–`v1.3`)

#### Profile
- [x] **Family section** on Profile (not separate tab)
- [ ] Flag-on zero-child adult sees Family section with empty copy (R1 — B2) — **Pass** contract 2
- [x] **Coach Tools section** role-gated (adult only; teen force-hide per R3)
- [x] Parent+coach sees both sections (Marcus reference) — **tier 3 regression:** Family + Coach Tools + Today dual blocks after PR #47
- [x] Family Profiles list + Add Child Profile
- [x] No Family on Play main feed

### Today / hub
- [x] Parent sees My Classes when enrolled
- [x] Coach sees Classes I teach / today card
- [x] R0 player Today: **no** MY CLASSES block (B4) — `@valadult862552` pre-coach
- [x] Teen Today: **no** MY CLASSES block (B4) — contract 3
- [x] Flag-on zero-child adult: MY CLASSES hidden until parent intent or children (B4)
- [x] Fresh account Family section visible when flag on + zero children (R1 — B2) — contract 2
- [x] Class detail tabs: Overview · Schedule · Roster · Chat

### Play
- [x] Classes segment + sport filter sync
- [x] Games/Players unchanged when flags off
- [x] Next-class / Coach-today cards only when relevant

### Inbox (when flag on)
- [x] Announcements reach parents not children
- [x] No coach–child private DM

### Create
- [x] Class/Clinic option only for adult coaches
- [ ] Teen Create sheet: no Class/Clinic regardless of `is_coach` (R3) — **Pass** contract 3 H2 probe

### Navigation
- [x] Invite enroll sheet → child picker
- [x] No 5th tab

## Screenshots required

`docs/contracts/screenshots/module-coach-parent-navigation/`

| File | State |
|------|-------|
| `01-profile-family-section.png` | Profile with Family section |
| `02-profile-coach-tools-section.png` | Profile Coach Tools (role) |
| `03-play-classes-segment.png` | Play Classes + sport filter |
| `04-today-my-classes-parent.png` | Parent My Classes on Today |
| `05-class-detail-roster.png` | Class detail Roster tab |
| `06-child-profile-picker.png` | Enroll invite picker |
| `07-coach-roster.png` | Coach roster statuses |
| `08-inbox-announcement.png` | Class announcement in Inbox |

## Human decision gates (H*)

| ID | Question | Decision |
|----|----------|----------|
| H1 | My Classes on Today vs only Rally hub? | **Both OK** — Today summary + hub detail |
| H2 | Classes sport filter? | **Required** |
| H3 | Profile section labels | **Family** · **Coach Tools** |
| H4 | 5th tab? | **No** |

## Out of scope (v1)

- 5th bottom tab
- Public child profiles on Play
- Child chat / coach–child DM
- Photos, reviews, in-app payments
- Academy substitute / consolidate (v1.5+)
- Self-serve "Apply to be a coach" — see [flow-become-a-coach.md](./flow-become-a-coach.md) (v2)
- First child without seed — [flow-parent-family-onboarding.md](./flow-parent-family-onboarding.md)

## Related

- [flow-play-screen.md](./flow-play-screen.md)
- [module-rally-hub.md](./module-rally-hub.md)
- [flow-inbox.md](./flow-inbox.md)
- [ui-roadmap-compact.md](../coach-parent-student/ui-roadmap-compact.md) — superseded by UI ideas doc for layout

## Validator report template

| # | Item | Pass | Notes |
|---|------|------|-------|
| 1 | Profile Family section | Pass | `01-profile-family-section.png` — Settings tab, FAMILY + Family Profiles |
| 2 | Profile Coach Tools section | Pass | `02-profile-coach-tools-section.png` — COACH TOOLS role-gated for marcus |
| 3 | Play Classes + sport filter | Pass | `03-play-classes-segment.png` — Classes pill + Badminton filter + classDiscover card |
| 4 | Today/hub class surfaces | Pass | `04-today-my-classes-parent.png`, `05-class-detail-roster.png` — MY CLASSES + coach roster |
| 5 | Child picker enroll | Pass | `06-child-profile-picker.png` — Alex/Mia picker for Beginner Badminton |
| 6 | No 5th tab / no public minors | Pass | 4 tabs only; inbox copy “To parents · not child DM”; `07-coach-roster.png`, `08-inbox-announcement.png` |
| 7 | **Tier 3 dual-role regression** | Pass | `09-tier3-profile-dual-sections.png`, `10-tier3-today-dual-blocks.png` — Marcus FAMILY + COACH TOOLS + MY CLASSES + CLASSES I TEACH on `dev` post-PR #48 |
