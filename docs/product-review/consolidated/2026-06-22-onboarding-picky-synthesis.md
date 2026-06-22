# Product review synthesis — 2026-06-22 · onboarding-picky

**Queue:** `onboarding-round2-picky` tier 2 · **Tag:** `onboarding-picky` · **Validation queue:** `cps-onboarding`  
**Consolidator:** product-review-consolidator · **Reviews:** 6/6 complete  
**Prior round:** [2026-06-21-onboarding-synthesis.md](./2026-06-21-onboarding-synthesis.md) (tier 1) · Builder B1–B6 largely shipped

## Reviews included

| persona-id | date | file |
|------------|------|------|
| `player-no-coach-tools` | 2026-06-22 | [../player-no-coach-tools/2026-06-22-review.md](../player-no-coach-tools/2026-06-22-review.md) |
| `coach-approved-manual` | 2026-06-22 | [../coach-approved-manual/2026-06-22-review.md](../coach-approved-manual/2026-06-22-review.md) |
| `parent-first-child` | 2026-06-22 | [../parent-first-child/2026-06-22-review.md](../parent-first-child/2026-06-22-review.md) |
| `parent-via-class-invite` | 2026-06-22 | [../parent-via-class-invite/2026-06-22-review.md](../parent-via-class-invite/2026-06-22-review.md) |
| `coach-first-class` | 2026-06-22 | [../coach-first-class/2026-06-22-review.md](../coach-first-class/2026-06-22-review.md) |
| `teen-restricted-account` | 2026-06-22 | [../teen-restricted-account/2026-06-22-review.md](../teen-restricted-account/2026-06-22-review.md) |

## Executive summary

Tier 2 picky confirms **B2–B4 fixes from round 1** (Family visible, teen H2 force-hide, Today MY CLASSES gated). Seeded/DB accounts complete most role journeys without founder help.

**New P0:** Fresh signup **legal gate silent failure** — `Before you play` → Continue does nothing when profile update fails (`Network request failed`). Blocks 4/6 personas from true fresh-account E2E (player, both parents, teen).

**New P1:** **Coach Create Class publishes pickup**, not `coach_class_listings` — non-Marcus approved coach cannot reach **Share parent enrollment invite** after publish (`coach-first-class`).

**Passes:** Coach before/after SQL + relaunch; parent Family + invite paths with `age_category` set; teen restrictions including H2 probe; class-enroll deep link UX.

**Known v1 stop (not builder regression):** Guardian consent lawyer gate — explicit blocker, not silent.

---

## Top pain themes (ranked)

| Rank | Theme | Personas (n) | Severity | Example quote / screen |
|------|-------|--------------|----------|------------------------|
| 1 | **Legal gate silent failure on fresh signup** — trapped on Before you play | 4/6 (`player-no-coach-tools`, `parent-first-child`, `parent-via-class-invite`, `teen-restricted-account`) | **P0** | Continue no-op; Metro `Failed to update user profile: Network request failed` |
| 2 | **Create Class → pickup activity** — no class listing / parent enroll share | 1/6 (`coach-first-class`) | **P1** | Post-publish **Pickup game** + host Copy link; CLASSES I TEACH empty |
| 3 | **`age_category` null on fresh signup** — false Adults only (tier 1 carry) | 2/6 (not re-tested — blocked by theme 1) | **P1** | Regression row still open until fresh signup completes |
| 4 | **`returnToInvite` resume after inline Add Child** | 1/6 (`parent-via-class-invite`) | **P2** | Not verified — lawyer gate stops before resume |
| 5 | **Coach approval requires full relaunch** | 1/6 (`coach-approved-manual`) | **P2** | SQL flip → force-quit → Coach Tools appear |
| 6 | **Teen Add Child form detour** before submit block | 1/6 (`teen-restricted-account`) | **P2** | Class invite → form → Adults only on Create |
| 7 | **Marcus-only demo class listings** mask coach-first gap | 1/6 (`coach-first-class`) | **P2** | Share parent enrollment invite only on Marcus `ClassDetail` |
| 8 | **VALIDATOR dev rows in Profile** | 5/6 | **P3** | Test class enroll picker visible |
| 9 | **Create Game header in class mode** | 2/6 | **P3** | Create Game + Publish game when Class/Clinic banner shown |

## Regressions fixed vs tier 1 (do not re-break)

| Fix | Verified by | Tier 2 result |
|-----|-------------|---------------|
| B2 Profile Family for zero-child parents | `parent-first-child` | **Pass** |
| B3/B4 Teen H2 + Today MY CLASSES | `teen-restricted-account` | **Pass** |
| B4 Today MY CLASSES for R0 / zero-child coach | `coach-approved-manual`, `parent-first-child` | **Pass** |
| Coach unlock after SQL + relaunch | `coach-approved-manual` | **Pass** |
| Class-enroll invite path | `parent-via-class-invite` | **Pass** (with DB account) |

---

## Recommended contract changes

| Priority | Contract file | Change type | Proposed diff summary |
|----------|---------------|-------------|----------------------|
| P0 | `flow-auth-onboarding.md` | Checklist + open issue | Legal gate (`TosAcceptanceGate`) must surface error + retry on profile update failure — no silent Continue no-op |
| P1 | `flow-create-game.md` | Checklist + north-star split | Coach `createMode: 'class'` must publish `coach_class_listings` and land on `ClassDetail` with parent enroll share — not pickup `createActivity` |
| P1 | `flow-coach-onboarding-org.md` | Checklist | CLASSES I TEACH lists coach-created classes for non-Marcus `is_coach` accounts |
| P1 | `flow-student-class-enrollment.md` | Prerequisite note | Coach must have persisted class listing before parent enroll E2E — blocked until B7 |
| P2 | `flow-teen-account-onboarding.md` | UX note | Hide + Add child on class invite picker for teens (policy holds via alert today) |
| P2 | `flow-become-a-coach.md` | TestFlight note | Document relaunch after SQL approval |
| P3 | `flow-parent-guardian-consent.md` | No change | Lawyer gate remains documented stop |

**Contract files to touch:** 5–6 files. **No `src/` in consolidator step.**

---

## Builder backlog (Layer 2 → Builder agent)

See: [2026-06-22-onboarding-picky-builder-backlog.md](./2026-06-22-onboarding-picky-builder-backlog.md)

| Priority | Item | Contract | Notes |
|----------|------|----------|-------|
| P0 | B7 Legal gate error UX + profile write reliability | `flow-auth-onboarding` | Alert + retry; fix network/root cause |
| P1 | B8 Coach class publish path | `flow-create-game` | `createMode: 'class'` → listing + ClassDetail |
| P1 | B1 carry `age_category` on signup | `flow-age-gate-onboarding` | Re-verify after B7 |
| P2 | B5 `returnToInvite` resume | `flow-student-class-enrollment` | Post-consent navigation |
| P2 | B9 Hide teen Add Child CTA on invite picker | `flow-teen-account-onboarding` | UX polish |

B2–B4 from tier 1: **do not regress** — spot-check in validation.

---

## Validation handoff (Layer 3)

See: [2026-06-22-onboarding-picky-validation-handoff.md](./2026-06-22-onboarding-picky-validation-handoff.md)

**Start:** `./.cursor/hooks/validation-loop-start.sh --queue cps-onboarding --from flow-auth-onboarding --builder`

---

## Out of scope (this cycle)

- In-app Become a coach apply (v2)
- Full guardian attestation E2E until lawyer clears
- Org/academy multi-coach (R6)

## Human decisions needed (H gates)

| ID | Question | Options | Recommended |
|----|----------|---------|-------------|
| R1 | Legal gate failure UX | A: Alert + retry · B: Skip gate in dev only | **A** |
| R2 | Coach class publish | A: Separate publish path · B: Defer coach-first to v2 | **A** |
| R3 | Teen invite Add Child CTA | A: Hide for teens · B: Keep form + alert | **A** (hide) |

---

## Per-persona tier 2 verdict

| persona-id | Verdict | Notes |
|------------|---------|-------|
| `player-no-coach-tools` | **Fail** | Fresh signup blocked at legal gate P0 |
| `coach-approved-manual` | **Pass** | Full before/after SQL journey |
| `parent-first-child` | **Partial pass** | B2/B4 pass on DB account; fresh signup blocked |
| `parent-via-class-invite` | **Partial pass** | Invite path pass; fresh signup blocked |
| `coach-first-class` | **Fail** | Wrong publish outcome for non-Marcus coach |
| `teen-restricted-account` | **Pass** | H2 probe + restrictions; fresh signup blocked |
