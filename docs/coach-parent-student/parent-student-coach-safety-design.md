# Parent, student, and coach safety design

**Date:** 2026-06-15  
**Status:** Design discovery — **not final legal policy**  
**Track:** [README.md](./README.md) · [implementation-plan.md](./implementation-plan.md)  
**Adult beta (parallel):** [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md)

---

## Short verdict

Coach should still be **coach**. **Parent** manages child/student profiles.

```text
Parent account
  → private reusable student profile
  → enrolled in class
  → visible to assigned coach / academy only through enrollment
  → not public
```

Do **not** let child/student profiles behave like normal public Rally users.

---

## Core design principles

1. Parent owns the child/student profile.
2. Coach gets scoped access through class enrollment.
3. Academy gets scoped access through organization enrollment.
4. Student profiles are **private by default**.
5. Under-13 should **not** create their own account in v1.
6. 13–17 can have a teen account later, with restrictions.
7. 18+ can own their account and manage child profiles.
8. No public discovery, public profile, or free-agent posts for minors.
9. No adult-to-child private messaging without parent visibility.
10. Payment should be parent/guardian-driven.

---

## Account creation age gate

Ask a **neutral age category** at account creation — not only “Are you 13+?”

```text
What is your age range?
  - Under 13
  - 13-17
  - 18+
```

Avoid exact date of birth unless legal/product forces it.

### Rules by age

| Age | Own account | Create child profile | Pay / manage class |
|-----|-------------|----------------------|---------------------|
| Under 13 | No | No | No — parent must create account |
| 13–17 | Yes, restricted | No | No / limited |
| 18+ | Yes | Yes (limits apply) | Yes |

**Under 13 at signup:** show *Please ask a parent or guardian to create an account and manage your class profile.*

**13–17:** teen profile; no child profiles; no payments; not public by default. Later: optional parent link for announcements.

**18+:** normal profile, host, coach (if approved), parent/guardian, payments.

Contract: [flow-age-gate-onboarding.md](../contracts/flow-age-gate-onboarding.md)

---

## Student profile ownership

Reusable, **parent-owned** — not class-owned, not coach-owned, not academy-only.

```text
Parent account
  → Student profile: "Alex"
  → Enrollment: Coach Amy Beginner Badminton
  → Enrollment: SGV Saturday Clinic
```

Contract: [module-student-profile.md](../contracts/module-student-profile.md)

---

## Visibility rules

| Viewer | Access |
|--------|--------|
| Parent/guardian | Full student profile |
| Under 13 | No independent login v1 |
| Teen 13–17 | Own teen profile; class rules TBD |
| Coach | Enrolled students in assigned classes only |
| Academy admin | Students in org classes |
| Substitute coach | Temporary session assignment |
| Other parents | Minimal or none |
| Public | **None** |

Students must **not** appear in: Discover, Free Agent, public roster, public leaderboard, public recap, search, public profile.

Contract: [module-student-visibility.md](../contracts/module-student-visibility.md)

---

## Coach and academy model

Organization **optional**. Same app, role-unlocked tools.

```text
Solo Coach — Coach Amy → Beginner Badminton Rally → Monday clinics

Academy — SGV Badminton Academy → coaches → classes
```

Aligns with [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md) § coach direction.

---

## Coach day-off / class operations (future paid)

| Action | Solo coach | Academy |
|--------|------------|---------|
| Cancel class | Yes | Yes |
| Defer to next week | Yes | Yes |
| Notify parents | Yes | Yes |
| Assign substitute | Limited | Yes |
| Consolidate classes | Limited | Yes |
| Reassign students | Limited | Yes |

Contract: [flow-coach-class-operations.md](../contracts/flow-coach-class-operations.md)

---

## Student aging / unbinding

| Transition | Policy |
|------------|--------|
| Under 13 → 13 | Stay parent-managed; no auto-unbind |
| 13–17 | Restricted teen; parent on communications |
| → 18 | Invite to claim adult account; verify; claim history; parent access removed by default |

**Legal review required** for regional age rules.

---

## Abuse prevention

**Do not use pricing as primary safety control.** Use permission, limits, verification, scoped enrollment.

| Risk | Control |
|------|---------|
| Fake child profile | 18+ gate + attestation + enrollment-only usefulness |
| Teammate as “child” joke | Limits (3–5 profiles) + report + no public visibility |
| Coach imports without parent | Coach invite → parent enrolls child |
| Impersonating parent | Attestation + audit log |
| Student in wrong surfaces | visibility module + RLS |

### Guardian attestation (creating child profile)

```text
I confirm I am this student's parent or legal guardian,
or I am authorized to manage this student profile.
```

### Suggested limits

| Account | Student profile limit |
|---------|----------------------|
| Adult free | 3–5 |
| Founding Coach (approved) | Higher for class roster imports via enrollment only |
| Coach Pro | Class-based |
| Academy | Org-managed, approved |

Parents stay **free** for normal family use. Coaches/academies pay for operational scale.

---

## Legal concerns (not legal advice)

Lawyer review before kid-class launch:

- COPPA / under-13 data
- Verifiable parental consent
- Parent access, deletion, retention
- Data minimization; no behavioral ads on child data
- Store age rating / audience declarations
- Adult–child messaging safety
- Class payment/refund terms
- Photo/media consent
- Coach/academy access boundaries
- Breach obligations

Contract: [flow-parent-guardian-consent.md](../contracts/flow-parent-guardian-consent.md)

---

## Roadmap (separate from friend-group beta)

| Release | Scope |
|---------|-------|
| v1.0 | Adult friend-group beta |
| v1.1 | Adult coach/organizer foundation |
| v1.2 | Parent student profile prototype |
| v1.3 | 1–2 coach pilots with parents |
| v1.4 | Solo Coach Pro beta |
| v2.0 | Academy + payments after legal review |

Full table: [release-track.md](./release-track.md)

---

## Recommended model (working)

```text
18+ adult creates Rally account
  → may create private student profiles
  → reusable across classes
  → enrollment grants coach/academy scoped access
  → under-13 no independent login v1
  → 13-17 restricted / later
  → at 18, student can claim and unbind
```

Balances coach utility, parent control, privacy, and future monetization.

**UI (tabs + Profile sections):** [parent-student-coach-ui-ideas.md](./parent-student-coach-ui-ideas.md)
