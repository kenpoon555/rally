# Flow — Student class enrollment

**Contract id:** `flow-student-class-enrollment`  
**Status:** **Partial** — Marcus seed path validated 2026-06-17; fresh-parent path blocked (`age_category`, `returnToInvite`) until Builder B1/B5  
**Screens:** Coach class invite, parent enrollment picker, confirmation  
**Product review:** [2026-06-21-onboarding-synthesis.md](../product-review/consolidated/2026-06-21-onboarding-synthesis.md)  
**Depends on:** `module-student-profile`, `flow-parent-guardian-consent`, `flow-parent-family-onboarding`, `flow-age-gate-onboarding`, `module-student-visibility`

## Purpose

Coach invites class → **parent** selects or creates student profile → enrolls child → coach sees roster. Prevents coach from unilaterally adding children without parent action.

North-star: **Coach invite link → parent enrolls Alex → coach roster shows Alex only for that class.**

**UI:** [parent-student-coach-ui-ideas.md](../coach-parent-student/parent-student-coach-ui-ideas.md) § Child profile picker

## Enrollment prerequisites (fresh accounts)

| Prerequisite | Contract | Must pass before inline add |
|--------------|----------|----------------------------|
| Parent `age_category = adult_18_plus` | [flow-age-gate-onboarding.md](./flow-age-gate-onboarding.md) | DB assertion after 18+ signup — not null |
| Profile Family visible (flag on) | [flow-parent-family-onboarding.md](./flow-parent-family-onboarding.md) | R1 locked — primary path Profile → Family → Add Child |
| Guardian consent | [flow-parent-guardian-consent.md](./flow-parent-guardian-consent.md) | Tier-1 green = reach consent screen; lawyer gate may block create |

**Path priority:** Profile Family is **primary** onboarding (R1). Class-invite inline add is **secondary** until Family visibility + `age_category` regressions are fixed.

## Demo setup (pilot — Marcus seed)

**Seed (run before Marcus-path validation):**

```bash
supabase db query --linked -f supabase/scripts/seed_parent_student_validation.sql
```

| Asset | Value |
|-------|--------|
| Parent login | `marcus@rally-mvrhoops.demo` / `MonroviaHoops26!` |
| Child profiles | Alex, Mia (under marcus) |
| Class invite | `rallyapp://class-enroll/b3000001-0001-4001-8001-000000000001` → Youth Basketball Clinic |
| Roster groups seed | Beginner Badminton — Alex (Not responded), Mia (Confirmed), Riley (Can't make it) |

1. Approved Founding Coach account (adult).
2. Parent account (18+) with consent completed.
3. Coach creates **class Rally** or class session (adult coach tools v1.1).
4. Coach shares **parent enrollment invite** (not child signup link).

## Demo setup (fresh parent — no seed)

1. Fresh 18+ signup via age gate — **do not** run `seed_parent_student_validation.sql`.
2. Verify DB: `select age_category from profiles where id = '<uuid>';` → `adult_18_plus`.
3. Path A — Profile: Family → Add Child → consent (or legal blocker).
4. Path B — Class invite: open enroll link → inline add with `returnToInvite` param.

## Required states

| State | Actor | Must show |
|-------|-------|-----------|
| **Coach invite** | Coach | Share link / QR for parents |
| **Parent opens invite** | Parent | Class name, sport; coach display name (P2 clarity) |
| **Child profile picker** | Parent | *Who is joining this class?* — Alex / Mia / + Add child profile |
| **No profiles yet** | Parent | Add child form: nickname, age range, skill level → consent → create and join |
| **Select student** | Parent | Tap existing profile card |
| **Consent** | Parent | Attestation if new profile — or legal-review blocker |
| **Enrolled** | Parent | Confirmation; which class |
| **Coach roster** | Coach | Enrolled students only — see `flow-coach-minor-class-roster` |
| **Duplicate enroll** | Parent | Idempotent or clear “already enrolled” |
| **End enrollment** | Parent or coach | Remove from class; coach loses access |
| **Parent `age_category` null** | Parent | Inline add blocked with “Adults only” — **fail** until B1 fixed |

## Pass/fail checklist

### Prerequisites (fresh parent — P0)

- [ ] Parent `age_category` is `adult_18_plus` before inline add from invite — not null after 18+ signup
- [ ] Fresh parent signup → Add Child from invite reaches consent screen (or legal blocker) — not “Adults only” alert
- [ ] Profile Family section visible for flag-on zero-child parent before invite-only detour — [flow-parent-family-onboarding.md](./flow-parent-family-onboarding.md) R1

### Marcus seed path (validated 2026-06-17)

- [x] Child cannot complete enrollment without parent logged in as 18+
- [x] Coach cannot add student without parent enrollment action
- [x] Parent can enroll same student in two classes (reusable profile)
- [ ] Unenroll removes coach view of student for that class
- [x] Invite token invalid/expired → clear error
- [x] No student data in public invite preview page
- [x] Picker shows class name + sport before child selection
- [x] + Add child profile opens consent + create inline (Marcus path)

### Fresh parent path (partial — validate after B1/B5)

- [ ] Inline add from enroll link with `returnToInvite` param → after create (post-consent) → returns to picker/confirm with invite context
- [ ] Class invite preview shows coach display name (currently class + sport only — P2 clarity)
- [ ] Same consent rules as Profile path — lawyer gate is expected tier-1 stop, not regression

### Stability

- [ ] No redbox on invite open, picker, or inline add paths

## Performance requirements

| ID | Metric | Budget |
|----|--------|--------|
| P1 | Invite deep link → picker visible | < 2s after JS handler |
| P2 | Inline create round-trip (post-consent) | < 3s |

## Estimated monthly cost

**Δ @ 50 / 200 MAU:** $0 — existing enrollment tables.

## External dependencies

| ID | Dependency |
|----|------------|
| E1 | Linked Supabase — enrollment + profile rows |
| E2 | `seed_parent_student_validation.sql` — Marcus-path rows only |
| E3 | Lawyer approval — inline create stops at consent blocker per [flow-parent-guardian-consent.md](./flow-parent-guardian-consent.md) |

## Human decision gates (H*)

| ID | Question | Decision |
|----|----------|----------|
| H1 | Invite-first vs Profile-first for zero-child parents? | **Profile-first** — R1 locked; invite is secondary |

## Screenshots required (when validating)

`docs/contracts/screenshots/flow-student-class-enrollment/`

1. `01-coach-invite-share.png`
2. `02-child-profile-picker.png`
3. `03-add-child-inline.png`
4. `04-enrolled-confirmation.png`
5. `05-coach-roster-after-enroll.png`
6. `06-return-to-invite-after-create.png` — fresh parent inline add resumes picker (post B5)

## Out of scope

- Waitlist / payment to enroll
- Bulk school roster import

## Related

- [flow-coach-minor-class-roster.md](./flow-coach-minor-class-roster.md)
- [flow-parent-family-onboarding.md](./flow-parent-family-onboarding.md)
- [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md) — adult coach v1.1 first

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-21 | Fresh parent: `age_category` null blocks inline add — B1 | Engineering |
| 2026-06-21 | `returnToInvite` ignored after inline Add Child — B5 | Engineering |
| 2026-06-21 | Coach display name missing on invite preview — P2 | Product |
| 2026-06-15 | Depends on adult coach class Rally | — |

## Validator report

| Item | Pass | Notes |
|------|------|-------|
