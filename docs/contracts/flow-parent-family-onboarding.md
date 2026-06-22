# Flow — Parent Family onboarding (first child profile)

**Contract id:** `flow-parent-family-onboarding`  
**Status:** **Tier-1 green 2026-06-22** — Family visible (B2), Add Child → legal consent blocker (expected)  
**Track:** v1.2 parent/student · [module-coach-parent-navigation.md](./module-coach-parent-navigation.md)  
**Product review:** [2026-06-21-onboarding-synthesis.md](../product-review/consolidated/2026-06-21-onboarding-synthesis.md)  
**Related code:** `ProfileFamilySection.tsx`, `FamilyProfilesScreen.tsx`, `AddChildProfileScreen.tsx`, `shouldShowFamilySection`, `coachParentFlags`, `parentStudentFlags`

## Purpose

An **18+ adult parent** with **no pre-seeded children** discovers Family, completes consent, and creates a first student profile — without Marcus demo rows or `seed_parent_student_validation.sql`.

North-star: **New parent → Profile Family (or class invite) → Add Child → consent → Alex profile exists → Family section lists Alex.**

## Preconditions

| Check | How |
|-------|-----|
| Account | 18+ signup (`flow-age-gate-onboarding`) |
| Flags | `EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE=true` and/or `EXPO_PUBLIC_PARENT_FAMILY_UI=true` |
| **No seed** | Do **not** run `seed_parent_student_validation.sql` on this account |
| Consent | `flow-parent-guardian-consent` — lawyer blocker may stop at attestation |

## Demo setup (no pre-seed)

1. Sign up fresh adult or use account with zero `student_profiles` rows.
2. Verify DB: `select count(*) from student_profiles where parent_user_id = '<uuid>';` → 0.
3. Path A — Profile: Family section → Family Profiles → Add Child Profile.
4. Path B — Coach invite: open `rallyapp://class-enroll/...` → + Add child profile inline.

## Required states

| State | How to reach | Must show |
|-------|--------------|-----------|
| **Non-parent (player)** | Regular adult, no children | **No** Family section |
| **Parent, flag on, zero children** | 18+ with `PARENT_FAMILY_UI`, zero `student_profiles` | **FAMILY** section on Profile Settings with empty copy + Add Child path (**R1 locked: Yes**) |
| **Family list empty** | Navigate Family Profiles | Hint + **Add Child Profile** CTA |
| **Consent gate** | Tap Add Child | Guardian consent or legal-review blocker per consent contract |
| **Profile created** | Consent OK + display name | Family section lists child; Today may show My Classes when enrolled |
| **Under-18 account** | Teen signup | Cannot create student profile — adult-only alert |

## Pass/fail checklist

### Signup prerequisite (P0 — blocks Add Child)

- [ ] After 18+ age-gate signup, DB `profiles.age_category = 'adult_18_plus'` without manual SQL — verify via Supabase or `supabase db query`
- [ ] Fresh parent signup → Add Child reaches consent screen (or documented legal blocker per [flow-parent-guardian-consent.md](./flow-parent-guardian-consent.md)) — **not** “Adults only” alert with null `age_category`
- [ ] Email-confirm deferral path: after first sign-in, `age_category` still matches age-gate selection — see [flow-age-gate-onboarding.md](./flow-age-gate-onboarding.md)

### Discovery (no pre-seed)

- [ ] Fresh 18+ parent: can reach Add Child without seeded Alex/Mia rows
- [ ] Flag-on 18+ parent with zero children sees **FAMILY** on Profile Settings with empty copy + Add Child path — primary Profile-first onboarding (**R1 locked**)
- [ ] `@kunyu` or regular player (R0): **no** Family section when zero children and not parent intent
- [ ] Family section subtitle: *Manage child/student profiles for classes*
- [ ] Add Child blocked for under-18 account with clear copy

### Create flow

- [ ] Add Child → consent screen (or documented legal blocker — not silent fail)
- [ ] Display name required; no child email in v1
- [ ] Success returns to Family list with new row
- [ ] Free tier: 6th active profile blocked with message

### Alternate entry (class invite — secondary until R1 green)

- [ ] Parent with zero profiles opens class enroll link → inline add child path (secondary entry; Profile Family is primary per R1)
- [ ] Same consent rules as Profile path
- [ ] Inline add from invite with `returnToInvite` returns to picker after create (post-consent) — see [flow-student-class-enrollment.md](./flow-student-class-enrollment.md)

### Regression

- [ ] Marcus seed path still works for Validator automation (separate run)
- [ ] Demo fallback rows in `coachParentService` do not appear for non-Marcus fresh accounts
- [ ] `shouldShowFamilySection` does not special-case Marcus user id — visibility from DB flags + student count only

## Performance requirements

| ID | Metric | Budget |
|----|--------|--------|
| P1 | Family list load | < 2s |
| P2 | Create profile round-trip | < 3s after consent |

## Estimated monthly cost

**Δ @ 50 / 200 MAU:** $0 — existing `student_profiles` table.

## External dependencies

| ID | Dependency |
|----|------------|
| E1 | Lawyer approval for attestation — [flow-parent-guardian-consent.md](./flow-parent-guardian-consent.md) |
| E2 | Linked Supabase for profile rows |

## Release decisions (2026-06-21 onboarding-round1)

| ID | Question | Decision |
|----|----------|----------|
| R1 | Show Profile **Family** when parent flags on + zero children? | **A: Yes** — Profile-first onboarding (locked) |
| R2 | Primary parent entry while Family hidden? | **A: Fix Family visibility (Builder B2)** — not invite-only |

## Human decision gates (H*)

| ID | Question | Default |
|----|----------|---------|
| H1 | Show Family section when flag on but zero children? | **Yes** — matches **R1 locked** |
| H2 | Hide Family until first child exists? | Rejected — use R1 Profile-first |
| H3 | Internal dev bypass for consent during pilot? | Founder-only — not production |

## Screenshots required

`docs/contracts/screenshots/flow-parent-family-onboarding/`

| File | State |
|------|-------|
| `01-profile-family-empty.png` | Family section — no children yet |
| `02-family-list-add-cta.png` | Family Profiles empty list + CTA |
| `03-consent-or-blocker.png` | Consent or legal-review blocker |
| `04-first-child-created.png` | List shows new child |

## Out of scope

- Child login / teen account claim
- Coach creating student on parent's behalf without invite
- Payment for classes

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-21 | **P0:** `shouldShowFamilySection` hides Family for flag-on zero-child adults (violates R1) | Engineering — B2 |
| 2026-06-21 | **P0:** Fresh 18+ signup leaves `profiles.age_category` null → “Adults only” before consent | Engineering — B1 |
| 2026-06-15 | Guardian attestation lawyer-blocked — tier-1 Validator stops at consent screen, not full create | Legal |

## Related

- [module-student-profile.md](./module-student-profile.md)
- [flow-parent-guardian-consent.md](./flow-parent-guardian-consent.md)
- [flow-student-class-enrollment.md](./flow-student-class-enrollment.md)

## Validator report

| Item | Pass | Notes |
|------|------|-------|
| 18+ age_category prerequisite | Pass | Contract 1 green; adult `val-age-adult-1782089862552@…` |
| Family section zero-child (R1) | Pass | Sim: FAMILY + *Manage child/student profiles for classes* |
| Add Child → consent/blocker | Pass | Guardian Consent · *Legal review in progress* (tier-1 OK) |
| Full child create E2E | N/A | Blocked by lawyer gate per consent contract |
