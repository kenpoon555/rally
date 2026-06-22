# Product review synthesis — 2026-06-21 · onboarding

**Queue:** `onboarding-round1` tier 1 · **Tag:** `onboarding` · **Validation queue:** `cps-onboarding`  
**Consolidator:** product-review-consolidator · **Reviews:** 6/6 complete

## Reviews included

| persona-id | date | file |
|------------|------|------|
| `player-no-coach-tools` | 2026-06-21 | [../player-no-coach-tools/2026-06-21-review.md](../player-no-coach-tools/2026-06-21-review.md) |
| `coach-approved-manual` | 2026-06-21 | [../coach-approved-manual/2026-06-21-review.md](../coach-approved-manual/2026-06-21-review.md) |
| `parent-first-child` | 2026-06-21 | [../parent-first-child/2026-06-21-review.md](../parent-first-child/2026-06-21-review.md) |
| `parent-via-class-invite` | 2026-06-21 | [../parent-via-class-invite/2026-06-21-review.md](../parent-via-class-invite/2026-06-21-review.md) |
| `coach-parent-dual` | 2026-06-21 | [../coach-parent-dual/2026-06-21-review.md](../coach-parent-dual/2026-06-21-review.md) |
| `teen-restricted-account` | 2026-06-21 | [../teen-restricted-account/2026-06-21-review.md](../teen-restricted-account/2026-06-21-review.md) |

## Executive summary

Round 1 onboarding reviews confirm **role gating works for seeded/reference accounts** (R0 player hiding, R1→R2 coach unlock after SQL + relaunch, R4 Marcus dual-role). **Fresh-account parent and teen journeys have P0 blockers** that prevent tier-1 contract green:

1. **`profiles.age_category` null after 18+ signup** → false “Adults only” alert blocks Add Child on both Profile and invite paths (2/6 personas, **P1**).
2. **Profile Family section hidden** when flags are on but `studentCount === 0` and user is not Marcus (2/6 parent personas, **P1** — contract H1 default violated).
3. **Teen + erroneous `is_coach=true`** exposes Coach Tools and CLASSES I TEACH (**H2 fail**, **P1** policy gap).
4. **Today MY CLASSES card** renders for all users when `PARENT_FAMILY_UI` is on — parent copy and Family deep link shown to R0 players, coaches with zero children, and teens (**4/6 personas**, **P2**).

**Known v1 stop (not builder):** guardian consent lawyer gate (`GUARDIAN_LAWYER_COPY_APPROVED=false`) blocks first-child creation and enrollment confirmation — explicit, not silent. Document in TestFlight notes; do not treat as regression.

**Passes worth preserving:** coach before/after unlock, class-enroll deep link UX, dual-role section separation on Profile/Today, teen restrictions when `is_coach=false`.

---

## Top pain themes (ranked)

| Rank | Theme | Personas (n) | Severity | Example quote / screen |
|------|-------|--------------|----------|------------------------|
| 1 | **`age_category` not persisted on fresh signup** — Add Child blocked before consent | 2/6 (`parent-first-child`, `parent-via-class-invite`) | **P0** | “Adults only” alert with null `profiles.age_category` after 18+ age-gate signup |
| 2 | **Profile Family hidden for flag-on zero-child parents** — primary onboarding path broken | 2/6 (+ cross-ref dual-role) | **P0** | Profile Settings: no FAMILY; Today “Manage classes for your child →” is only entry |
| 3 | **Teen coach surface leak when `is_coach=true`** — H2 contract fail | 1/6 (`teen-restricted-account`) | **P0** | Coach Tools + CLASSES I TEACH after DB `is_coach=true` on teen account |
| 4 | **Today MY CLASSES shown to non-parents** — wrong copy + detour to Family Profiles | 4/6 (`player-no-coach-tools`, `coach-approved-manual`, `parent-first-child`, `teen-restricted-account`) | **P1** | “No upcoming classes for your children.” on R0 player and teen Today |
| 5 | **`returnToInvite` ignored after inline Add Child** — enrollment resume gap | 1/6 (`parent-via-class-invite`) | **P1** | Param passed from invite/picker; `AddChildProfileScreen` does not navigate back |
| 6 | **Marcus ID hardcode masks fresh-account bugs** | 1/6 explicit (+ implicit in family/coach helpers) | **P1** | `shouldShowFamilySection` / `userIsCoach` return true for Marcus regardless of DB |
| 7 | **Coach approval requires full app relaunch** — no live profile refresh | 1/6 (`coach-approved-manual`) | **P2** | SQL flip → force-quit → relaunch before Coach Tools appear (v1 acceptable; document) |
| 8 | **Create Game title when in Class/Clinic mode** — easy to misread | 2/6 (`coach-approved-manual`, `coach-parent-dual`) | **P3** | Shared Create Game screen with Class/Clinic sub-banner only |
| 9 | **VALIDATOR dev rows in Profile Settings** — review noise | 5/6 | **P3** | “Test class enroll picker” visible outside `__DEV__` |
| 10 | **No in-app “Become a coach” apply** | 1/6 (`coach-approved-manual`) | **v2** | Founder SQL/dashboard only — matches v1 stub |

---

## Recommended contract changes

| Priority | Contract file | Change type | Proposed diff summary |
|----------|---------------|-------------|----------------------|
| P0 | `flow-parent-family-onboarding.md` | Checklist + open issue | Mark Profile Family visibility **fail** until `shouldShowFamilySection` shows when flag on + zero children (H1 default). Add signup regression row: `age_category = adult_18_plus` after 18+ signup. |
| P0 | `flow-student-class-enrollment.md` | Checklist + prerequisite | Add enrollment prerequisite: parent `age_category` must be adult before inline add. Document `returnToInvite` resume after create. Mark invite-first as **secondary** path until H1 fix (or H gate if invite-first wins). |
| P0 | `flow-teen-account-onboarding.md` | Checklist + Validator row | Mark H2 **P1 fail** with explicit row: teen + `is_coach=true` must hide Coach Tools and CLASSES I TEACH. Add Today rule: hide MY CLASSES / Family links for `teen_13_17`. |
| P0 | `flow-age-gate-onboarding.md` or `flow-auth-onboarding.md` | Checklist | Add post-signup DB assertion: `profiles.age_category` matches age-gate selection for all paths (including email-confirm deferral). |
| P1 | `flow-coach-onboarding-org.md` | Checklist | R0: no parent-oriented MY CLASSES copy. Clarify Play Classes tab browse OK vs create hidden for non-coach. |
| P1 | `module-coach-parent-navigation.md` | Cross-link + note | Document Marcus as reference dual-role demo; link teen age gate on Create flow. Optional Today scroll-density note for dual-role. |
| P1 | `flow-become-a-coach.md` | TestFlight script | Add reviewer script: signup → no tools → SQL → relaunch → screenshot checklist. Note CLASSES I TEACH as alternate entry. Cross-link MY CLASSES visibility rule. |
| P2 | `flow-student-class-enrollment.md` | Checklist clarity | Coach display name on class invite preview (currently class + sport only). |
| P2 | `flow-parent-guardian-consent.md` | Documented blocker | Keep lawyer gate as known tier-1 stop — TestFlight note only. |
| P3 | `flow-create-game.md` | Copy note | Coach-specific header when class mode active (backlog, not blocking). |

**Contract files to touch on approve:** 8 files listed above. **No `src/` edits in this step.**

---

## Builder backlog (Layer 2 → Builder agent)

See standalone: [2026-06-21-onboarding-builder-backlog.md](./2026-06-21-onboarding-builder-backlog.md)

| Priority | Item | Contract | Likely files | Notes |
|----------|------|----------|--------------|-------|
| P0 | Persist `age_category` on all signup paths | `flow-parent-family-onboarding`, `flow-age-gate-onboarding` | `AuthContext.tsx`, `userService.ts` | Verify email-confirm deferral and profile retry paths |
| P0 | Fix `shouldShowFamilySection` for flag-on zero-child adults | `flow-parent-family-onboarding` | `coachParentService.ts`, `ProfileFamilySection.tsx`, `useCoachParent.ts` | H1 default: show empty Family when parent flags on |
| P0 | Gate coach surfaces with adult age check (H2) | `flow-teen-account-onboarding` | `coachParentService.ts` (`userIsCoach`, `shouldShowCoachToolsSection`), `DynamicHomeScreen.tsx` | Teen + `is_coach=true` must not show Coach Tools or CLASSES I TEACH |
| P1 | Gate Today MY CLASSES card by parent intent | `flow-coach-onboarding-org`, `flow-teen-account-onboarding` | `DynamicHomeScreen.tsx`, `TodayMyClassesCard.tsx`, `useCoachParent.ts` | Hide when `studentCount === 0` and not adult parent; never for teens |
| P1 | Honor `returnToInvite` after inline Add Child | `flow-student-class-enrollment` | `AddChildProfileScreen.tsx`, `ParentClassInviteScreen.tsx`, `ChildProfilePickerScreen.tsx` | Resume enroll flow after create + consent |
| P1 | Remove Marcus ID hardcode from role helpers | `flow-become-a-coach`, `module-coach-parent-navigation` | `coachParentService.ts` | Keep seed data separate from visibility logic |
| P2 | Gate VALIDATOR Profile rows behind `__DEV__` | — | Profile Settings screen | Dev noise across 5/6 reviews |
| P3 | Create Class screen title when class mode | `flow-create-game` | Create Game screen | Copy-only improvement |

---

## Validation handoff (Layer 3)

See standalone: [2026-06-21-onboarding-validation-handoff.md](./2026-06-21-onboarding-validation-handoff.md)

| Order | Contract id | Why now |
|-------|-------------|---------|
| 1 | `flow-parent-family-onboarding` | P0 — Family discovery + age_category block first-child path |
| 2 | `flow-teen-account-onboarding` | P0 — H2 policy fail on erroneous coach flag |
| 3 | `flow-student-class-enrollment` | P0/P1 — invite path + returnToInvite after builder fixes |
| 4 | `flow-age-gate-onboarding` | P0 — signup age_category regression guard |
| 5 | `flow-become-a-coach` | P2 process — coach unlock path largely green; validate after relaunch doc |
| 6 | `flow-coach-onboarding-org` | P1 — R0 MY CLASSES + role hiding regression |
| 7 | `module-coach-parent-navigation` | Reference pass — re-run Marcus dual-role after hardcode removal |

**Start command (after human approve + Builder):**

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue cps-onboarding --builder
```

---

## Out of scope (this cycle)

- In-app “Become a coach” apply form and admin approval queue (v2)
- Realtime profile refresh after coach approval (v2 — relaunch documented for v1)
- Guardian consent lawyer approval — blocks end-to-end child create/enroll until legal clears
- Coach display name on invite preview (P2 contract clarity only)
- Create Game vs Create Class header polish (P3)
- Academy/org admin flows (`academy-head-coach` — tier 3 queue)
- Sport-specific onboarding copy (all reviews used badminton or mixed demo seeds; role behavior is sport-agnostic)

---

## Human decisions needed (H gates)

| ID | Question | Options | Reviews affected |
|----|----------|---------|------------------|
| H1 | Show Profile **Family** when parent flags on but zero children? | **A (recommended):** Yes — Profile-first onboarding per contract default · **B:** Hide until first child — invite-only onboarding | `parent-first-child`, `parent-via-class-invite` |
| H2 | Primary parent entry while Family hidden? | **A:** Fix Family visibility (builder P0) · **B:** Document class-invite as primary until Profile ships | `parent-via-class-invite` |
| H3 | Teen erroneous `is_coach` handling | **A (recommended):** Force-hide all coach surfaces for `teen_13_17` · **B:** Allow coach tools for emancipated edge case (needs policy) | `teen-restricted-account` |
| H4 | Approve contract diffs + builder backlog before Layer 2 PR? | **Required gate** — run `./.cursor/hooks/product-review-loop-approve.sh` or explicit chat approval | This synthesis |

---

## Persona pass/fail rollup

| Persona | Tier-1 verdict | Blockers |
|---------|----------------|----------|
| `player-no-coach-tools` | **Pass** (primary check) | MY CLASSES copy P2 |
| `coach-approved-manual` | **Pass** (before/after unlock) | Relaunch P2; MY CLASSES P2 |
| `parent-first-child` | **Partial fail** | Family hidden P0; age_category P0; legal gate (expected) |
| `parent-via-class-invite` | **Partial fail** | age_category P0; returnToInvite P1; legal gate (expected) |
| `coach-parent-dual` | **Pass** | Marcus hardcode masks fresh-account gaps |
| `teen-restricted-account` | **Partial fail** | H2 coach leak P0; MY CLASSES on teen P1 |

**Screenshots cited across reviews:** `docs/product-review/{persona-id}/2026-06-21/*.png`
