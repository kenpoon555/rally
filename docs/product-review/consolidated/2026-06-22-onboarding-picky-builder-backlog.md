# Builder backlog — 2026-06-22 · onboarding-picky

**Source:** [2026-06-22-onboarding-picky-synthesis.md](./2026-06-22-onboarding-picky-synthesis.md)  
**Queue:** `onboarding-round2-picky` tier 2  
**Prior backlog:** [2026-06-21-onboarding-builder-backlog.md](./2026-06-21-onboarding-builder-backlog.md) (B1–B6 — largely shipped)

---

## P0 — Ship blockers

### B7 · Legal gate — no silent failure on profile update

| Field | Value |
|-------|-------|
| **Contract** | `flow-auth-onboarding` |
| **Personas** | 4/6 fresh-signup personas |
| **Symptom** | `TosAcceptanceGate` Continue no-op when `acceptLegalTerms` / profile update fails (`Network request failed`) |
| **Likely files** | `src/components/legal/TosAcceptanceGate.tsx` (or equivalent), `src/services/userService.ts`, `AuthContext` profile bootstrap |
| **Suggested checklist row** | Legal gate shows user-facing error + retry; successful accept navigates to main app |
| **Acceptance** | Fresh `@playerr0t2picky`-style signup completes legal gate without manual DB |

---

## P1 — Coach class + signup carry

### B8 · Coach Create Class → class listing (not pickup)

| Field | Value |
|-------|-------|
| **Contract** | `flow-create-game`, `flow-student-class-enrollment` |
| **Personas** | `coach-first-class` (1/6) |
| **Symptom** | `createMode: 'class'` calls `createActivity` pickup path; post-create shows Pickup game + host Copy link; CLASSES I TEACH empty |
| **Likely files** | `CreateActivityScreen.tsx`, coach class service, `ClassDetailScreen.tsx`, `listCoachClasses` |
| **Suggested checklist row** | Non-Marcus approved coach publish → `coach_class_listings` row → ClassDetail with **Share parent enrollment invite** |
| **Acceptance** | `@playerr0474532` Create Class → publish → class detail with `class-enroll` share (not `shareGameInvite`) |

### B1 · Persist `age_category` on signup (carry — re-verify after B7)

| Field | Value |
|-------|-------|
| **Contract** | `flow-age-gate-onboarding`, `flow-parent-family-onboarding` |
| **Personas** | `parent-first-child`, `parent-via-class-invite` |
| **Status** | Partially fixed for tier-1 accounts; fresh path blocked by B7 |
| **Acceptance** | Fresh 18+ signup → Add Child reaches consent (not Adults only) |

---

## P2 — Enrollment polish

### B5 · `returnToInvite` after inline Add Child (carry)

| Field | Value |
|-------|-------|
| **Contract** | `flow-student-class-enrollment` |
| **Personas** | `parent-via-class-invite` |
| **Likely files** | `AddChildProfileScreen.tsx`, `ChildProfilePickerScreen.tsx` |
| **Acceptance** | Post-consent, navigation returns to class invite picker with context |

### B9 · Hide + Add child on class invite for teens

| Field | Value |
|-------|-------|
| **Contract** | `flow-teen-account-onboarding` |
| **Personas** | `teen-restricted-account` |
| **Likely files** | `ChildProfilePickerScreen.tsx` or invite screen |
| **Acceptance** | Teen class-enroll shows block before Add Child form (or hides CTA) |

---

## Do not regress (spot-check in validation)

| Item | Original | Verified tier 2 |
|------|----------|-----------------|
| B2 Family section | `parent-first-child` | Pass |
| B3 Teen coach hide | `teen-restricted-account` | Pass (H2) |
| B4 Today MY CLASSES gate | multiple | Pass |
| B6 Marcus hardcode removal | implicit | Coach unlock works non-Marcus |

---

## Suggested implementation order

1. **B7** (unblocks fresh signup validation for all personas)
2. **B8** (coach-first-class north-star)
3. **B1** re-verify on fresh accounts
4. **B5**, **B9** polish

After P0/P1: `./.cursor/hooks/validation-loop-start.sh --queue cps-onboarding --from flow-auth-onboarding --builder`
