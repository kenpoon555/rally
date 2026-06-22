# Flow — Become a coach (role unlock)

**Contract id:** `flow-become-a-coach`  
**Status:** **Green** — validation 2026-06-22: `@valadult862552` non-Marcus before/after `is_coach` + relaunch  
**Track:** v1.1 coach foundation · [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md)  
**Product review:** [2026-06-21-onboarding-synthesis.md](../product-review/consolidated/2026-06-21-onboarding-synthesis.md)  
**Related code:** `profiles.is_coach`, `ProfileCoachToolsSection.tsx`, `coachParentService.userIsCoach`, `CreateActivityScreen` (class mode), `DynamicHomeScreen.tsx`

## Purpose

An adult user **without** coach role does not see Coach Tools; after **approved** onboarding they see Coach Tools and can create classes.

North-star (v1 beta): **Regular player → founder approves → relaunch app → Coach Tools + Create Class available.**  
North-star (v2): **User applies in Profile → admin approves → same unlock without manual SQL.**

## Preconditions

| Check | v1 beta | v2 target |
|-------|---------|-----------|
| Account | 18+ adult (`age_category` adult) | Same |
| Starting state | `is_coach = false` — **no** coach seed on account | Same |
| Flags | `EXPO_PUBLIC_ENABLE_COACH_FOUNDATION=true` (or bundle) | Same |
| Approval | Founder runs linked DB update or internal admin tool | In-app apply + admin queue |

**Do not** run `seed_coach_parent_validation.sql` on accounts testing this flow.

## Demo setup (v1 — manual approval)

1. Fresh adult account or `@kunyu` with `is_coach = false`.
2. Confirm Profile has **no** Coach Tools section.
3. Founder approves (linked preview):

```sql
update public.profiles
set is_coach = true
where email = '<reviewer@email.com>';
```

4. Reviewer force-quits app → reopens → Profile shows **Coach Tools**.

### TestFlight / App Review script (v1 manual approval)

Copy into App Store Connect **Notes for reviewer** or internal QA runbook:

```text
Coach unlock (manual v1 — no in-app apply):

1. Sign up fresh 18+ adult OR use reviewer account with is_coach = false.
2. Profile → confirm NO Coach Tools section.
3. Play → Create → confirm NO Class/Clinic option.
4. Today → confirm NO CLASSES I TEACH card (unless already enrolled as parent).
5. Founder approves via linked DB:
     update public.profiles set is_coach = true where email = '<reviewer@email.com>';
6. Force-quit app → relaunch (v1 requires relaunch — no live profile refresh).
7. Profile → Coach Tools visible (Create Class, Coach Profile).
8. Play → Create → Class/Clinic option present.
9. Today → CLASSES I TEACH card visible as alternate coach entry.
10. Screenshot: 01-profile-no-coach-tools → 02-after-approval-coach-tools → 03-create-class-entry.

Use non-Marcus email to avoid demo hardcode masking visibility bugs.
Teen accounts must NEVER see steps 7–9 even if is_coach=true — see flow-teen-account-onboarding H2 probe.
MY CLASSES parent card on Today: hidden for R0/teen — see flow-coach-onboarding-org.
```

## Required states

| State | How to reach | Must show |
|-------|--------------|-----------|
| **Non-coach** | Login as regular adult | No Coach Tools; Play create has no Class/Clinic (unless separate flag) |
| **Pending approval (v2 only)** | Submit apply form | “We’ll review within X days” — **not built v1** |
| **Approved coach** | After `is_coach = true` + app relaunch (v1) | Coach Tools section; Create Class; coach role on Play create; **CLASSES I TEACH** on Today as alternate entry |
| **Rejected (v2 only)** | Admin rejects | Clear message; no partial coach UI — **not built v1** |

## Pass/fail checklist

### v1 — validate now

- [x] Non-coach adult: Profile has **no** Coach Tools section
- [x] Non-coach adult: `userIsCoach` false — no coach-only Create Class entry
- [x] After DB `is_coach = true`: Coach Tools section appears after **force-quit + relaunch** (v1 — no live refresh)
- [x] Approved coach: Create Class navigates to class create flow
- [x] Approved coach: Today shows **CLASSES I TEACH** card — alternate entry alongside Profile Coach Tools
- [x] R0 non-coach Today: **no** parent-oriented MY CLASSES copy — cross-ref [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md)
- [x] No UI text promises “assign substitute coach” or academy features (v2)
- [x] Marcus demo works via DB flags + seed — **not** hardcoded user id in `userIsCoach` / `shouldShowFamilySection` (B6)
- [x] Validator uses **non-Marcus** email for before/after unlock test

### v2 — stub only (fail if shipped without this contract updated)

- [ ] Profile entry: “Become a coach” or Founding Coach interest form
- [ ] Apply captures sport, area, payment link optional
- [ ] Admin notification / queue for founder review
- [ ] Approval flips `is_coach` without manual SQL
- [ ] Rejection email or in-app message

## Performance requirements

| ID | Metric | Budget | How to measure |
|----|--------|--------|----------------|
| P1 | Profile load after role flip | Coach Tools visible on first Profile open after relaunch | Manual |
| P2 | Create Class navigation | < 2s to form | Sim tap |

## Estimated monthly cost

**Δ @ 50 MAU:** $0 — boolean column on `profiles`.  
**Δ @ 200 MAU:** $0.  
v2 apply queue: +$0–1 edge/admin tooling when built.

## External dependencies

| ID | Dependency | Notes |
|----|------------|-------|
| E1 | Linked Supabase | v1 approval via `supabase db query` or dashboard |
| E2 | EAS env | `EXPO_PUBLIC_ENABLE_COACH_FOUNDATION` on TestFlight builds |

## Human decision gates (H*)

| ID | Question | v1 decision |
|----|----------|-------------|
| H1 | Self-serve apply in beta? | **No** — manual approval only |
| H2 | Who can approve coaches? | Founder / internal admin |
| H3 | Founding Coach payment before unlock? | **No** — manual billing after pilot |
| H4 | Minimum coach verification (background check)? | Deferred — document in pilot terms |

## Screenshots required

`docs/contracts/screenshots/flow-become-a-coach/`

| File | State |
|------|-------|
| `01-profile-no-coach-tools.png` | Regular adult — section absent |
| `02-after-approval-coach-tools.png` | Same user after `is_coach` |
| `03-create-class-entry.png` | Coach Tools → Create Class |

## Out of scope

- Academy / multi-coach org — [flow-organization-coaches.md](./flow-organization-coaches.md)
- Stripe / Founding Coach checkout
- Coach background check workflow

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-21 | Marcus id hardcoded in `userIsCoach` / `shouldShowFamilySection` — masks fresh-account tests — B6 | Engineering |
| 2026-06-15 | No in-app apply — v1 manual only | Product |
| 2026-06-15 | Coach approval requires full app relaunch — v1 acceptable; document in TestFlight notes (B7) | Product |

## Related

- [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md)
- [module-coach-parent-navigation.md](./module-coach-parent-navigation.md)
- [flow-create-game.md](./flow-create-game.md)

## Validator report

| Item | Pass | Notes |
|------|------|-------|
| Before unlock | Pass | `@valadult862552` — no Coach Tools; Create sheet game-only (`01-profile-no-coach-tools.png`) |
| After `is_coach=true` + relaunch | Pass | Coach Tools + CLASSES I TEACH + Class/Clinic (`02`, `03`) |
| B6 no Marcus hardcode | Pass | `userIsCoach` uses `is_coach` only |
