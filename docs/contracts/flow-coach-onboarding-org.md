# Flow — Coach role, organization & class ownership

**Contract id:** `flow-coach-onboarding-org`  
**Status:** **Green** — validation 2026-06-22: Marcus dual-role + `@valadult862552` R0/coach Today gating (B4)  
**Product review:** [2026-06-21-onboarding-synthesis.md](../product-review/consolidated/2026-06-21-onboarding-synthesis.md)  
**Related code:** `profiles.is_coach`, `ProfileCoachToolsSection.tsx`, `coachParentService.ts`, `DynamicHomeScreen.tsx`, `TodayMyClassesCard.tsx`, `flow-coach-class-operations.md`

## Purpose

Document **who can coach**, **how they get the role**, and **what happens when a coach is unavailable** — solo vs academy.

North-star (v1): **Solo coach creates class → defers or cancels → parents notified.**  
North-star (v2): **Academy assigns substitute coach → roster stays with substitute.**

## v1 shipped (today)

| Capability | In app? | How |
|------------|---------|-----|
| **Coach Tools UI** | Yes (flag on) | `profiles.is_coach = true` OR hardcoded demo Marcus id |
| **Become a coach (self-serve)** | **No** | Admin/seed sets `is_coach`; no apply flow in Profile |
| **Create Class** | Yes | Profile → Coach Tools → Create Class |
| **Create Class from Play** | Yes | Coach role picker when hosting |
| **Solo defer / cancel class** | Yes | [flow-coach-class-operations.md](./flow-coach-class-operations.md) |
| **Reassign class to another coach** | **No** | v1.5+ / academy v2.0 |
| **Organization / academy entity** | **No** | Deferred per [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md) |

## Role model (target)

```text
Solo coach (v1)
  profiles.is_coach = true
  → owns classes they create
  → vacation: defer | cancel | notify parents

Academy (v2 — not built)
  organization → coaches[] → classes[]
  → head coach reassigns session to substitute
  → parents see same class, new coach name
```

## Demo setup

```bash
supabase db query --linked -f supabase/scripts/seed_coach_parent_validation.sql
supabase db query --linked -f supabase/scripts/seed_parent_student_validation.sql
```

Login: `marcus@rally-mvrhoops.demo` → Profile → **Coach Tools** + **Family**

Non-coach: `@kunyu` → **no** Coach Tools section

## Pass/fail checklist

### v1 (validate now)

- [x] Marcus: Profile shows **Coach Tools** (Create Class, Coach Profile)
- [x] Marcus: Play → Create shows **Class/Clinic** option
- [x] Non-coach (`@valadult862552` pre-approval): no Coach Tools section — `@kunyu` password unavailable; DB `is_coach=false`
- [x] Non-coach adult: Play → **Classes** segment browse OK when flag on — **no** Class/Clinic on Create sheet
- [ ] Class defer/cancel works — see `flow-coach-class-operations`
- [x] **No** UI promises "assign substitute" or "transfer to another coach"

### Today MY CLASSES visibility (P1 — B4)

- [x] R0 player (`@valadult862552` pre-coach, zero children): Today has **no** MY CLASSES block
- [x] R0 player Today: **no** “Manage classes for your child →” Family deep link
- [x] Approved coach with zero children and no student profiles: Today has **no** parent-oriented MY CLASSES copy — `@valadult862552` post-approval shows CLASSES I TEACH only
- [x] Teen account: Today has **no** MY CLASSES — see [flow-teen-account-onboarding.md](./flow-teen-account-onboarding.md)
- [x] Adult parent with `studentCount > 0` or active enrollments: MY CLASSES shows appropriate parent copy — Marcus seed
- [x] Coach with classes: **CLASSES I TEACH** card visible — alternate entry to coach tools per [flow-become-a-coach.md](./flow-become-a-coach.md)
- [ ] Non-Marcus approved coach: **Create Class** publish adds row to **CLASSES I TEACH** (not demo-only Marcus filter) — tier 2 picky B8

### v2 (document only — fail if shipped without contract)

- [ ] Organization admin can invite coaches — not in v1
- [ ] Reassign session to substitute — not in v1
- [ ] Consolidate two classes — not in v1

## Human decision gates (H*)

| ID | Question | Decision |
|----|----------|----------|
| H1 | How does a user become a coach in beta? | **Manual** — founder sets `is_coach` or seed Marcus; no self-serve apply |
| H2 | Vacation handling for solo coach? | **Defer or cancel** + parent notify (v1.4) |
| H3 | When do we ship academy / reassign? | **After GTM 2** — v2.0 org model |
| H4 | Founding Coach pricing / Pro gate? | Manual offers — no Stripe in v1 |

## Screenshots required

`docs/contracts/screenshots/flow-coach-onboarding-org/`

| File | State |
|------|-------|
| `01-profile-coach-tools-marcus.png` | Coach Tools visible |
| `02-profile-no-coach-tools-kunyu.png` | Regular user — section hidden |
| `03-create-class-entry.png` | Create Class navigation |
| `04-class-ops-defer-cancel.png` | Solo ops sheet (cross-ref coach-ops) |

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | Create Class publish creates pickup activity — CLASSES I TEACH empty for non-Marcus coaches | Builder B8 |
| 2026-06-21 | Today MY CLASSES renders for all flag-on users — parent copy on R0/teen/coach — **fixed B4** | Engineering |
| 2026-06-21 | No in-app "become a coach" — v1 manual; spec in [flow-become-a-coach.md](./flow-become-a-coach.md) | Product |

## Related

- [flow-become-a-coach.md](./flow-become-a-coach.md) — manual approval → Coach Tools unlock
- [flow-organization-coaches.md](./flow-organization-coaches.md) — v2 multi-coach org (stub)
- [ONBOARDING-CONTRACT-INDEX.md](./ONBOARDING-CONTRACT-INDEX.md)
- [module-coach-parent-navigation.md](./module-coach-parent-navigation.md)
- [flow-coach-class-operations.md](./flow-coach-class-operations.md)
- [parent-student-coach-safety-design.md](../coach-parent-student/parent-student-coach-safety-design.md)
