# Flow — Student class enrollment

**Contract id:** `flow-student-class-enrollment`  
**Status:** Implemented — v1.3 pilot validated 2026-06-17  
**Screens:** Coach class invite, parent enrollment picker, confirmation  
**Depends on:** `module-student-profile`, `flow-parent-guardian-consent`, `module-student-visibility`

## Purpose

Coach invites class → **parent** selects or creates student profile → enrolls child → coach sees roster. Prevents coach from unilaterally adding children without parent action.

North-star: **Coach invite link → parent enrolls Alex → coach roster shows Alex only for that class.**

**UI:** [parent-student-coach-ui-ideas.md](../coach-parent-student/parent-student-coach-ui-ideas.md) § Child profile picker

## Demo setup (pilot)

**Seed (run before validation):**

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

## Required states

| State | Actor | Must show |
|-------|-------|-----------|
| **Coach invite** | Coach | Share link / QR for parents |
| **Parent opens invite** | Parent | Class name, coach name, sport |
| **Child profile picker** | Parent | *Who is joining this class?* — Alex / Mia / + Add child profile |
| **No profiles yet** | Parent | Add child form: nickname, age range, skill level → consent → create and join |
| **Select student** | Parent | Tap existing profile card |
| **Consent** | Parent | Attestation if new profile |
| **Enrolled** | Parent | Confirmation; which class |
| **Coach roster** | Coach | Enrolled students only — see `flow-coach-minor-class-roster` |
| **Duplicate enroll** | Parent | Idempotent or clear “already enrolled” |
| **End enrollment** | Parent or coach | Remove from class; coach loses access |

## Pass/fail checklist

- [x] Child cannot complete enrollment without parent logged in as 18+
- [x] Coach cannot add student without parent enrollment action
- [x] Parent can enroll same student in two classes (reusable profile)
- [ ] Unenroll removes coach view of student for that class
- [x] Invite token invalid/expired → clear error
- [x] No student data in public invite preview page
- [x] Picker shows class name + coach before child selection
- [x] + Add child profile opens consent + create inline

## Screenshots required (when validating)

`docs/contracts/screenshots/flow-student-class-enrollment/`

1. `01-coach-invite-share.png`
2. `02-child-profile-picker.png`
3. `03-add-child-inline.png`
4. `04-enrolled-confirmation.png`
5. `05-coach-roster-after-enroll.png`

## Out of scope

- Waitlist / payment to enroll
- Bulk school roster import

## Related

- [flow-coach-minor-class-roster.md](./flow-coach-minor-class-roster.md)
- [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md) — adult coach v1.1 first

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-15 | Depends on adult coach class Rally | — |
