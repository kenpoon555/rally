# Flow — Parent / guardian consent

**Contract id:** `flow-parent-guardian-consent`  
**Status:** Implemented (infrastructure) — **attestation copy blocked until lawyer approval**  
**Track:** v1.2  
**Product review:** [2026-06-21-onboarding-synthesis.md](../product-review/consolidated/2026-06-21-onboarding-synthesis.md)

## Tier-1 validation scope (2026-06-21)

**Green for parent onboarding contracts means:** parent reaches consent screen or documented legal-review blocker — **not** full child profile create or class enrollment E2E.

| Stop | Expected? | TestFlight / reviewer note |
|------|-----------|----------------------------|
| Legal-review blocker at Add Child | **Yes** — `lawyer_copy_approved = false` | Not a regression — explicit “Legal review in progress” copy is correct |
| Full attestation + child create | **No** until H1 lawyer clears | Do not file false regression if enroll stops at consent |
| Guardian consent lawyer gate | Hard stop | Document in App Review notes alongside demo login — [store-review-test-accounts.md](../store-review-test-accounts.md) |

Cross-ref: [flow-parent-family-onboarding.md](./flow-parent-family-onboarding.md) · [flow-student-class-enrollment.md](./flow-student-class-enrollment.md)

## Lawyer copy approval

| Field | Value |
|-------|-------|
| **lawyer_copy_approved** | `false` |
| **approved_copy** | *(empty — counsel updates this field and `src/constants/guardianConsent.ts` together)* |

Until `lawyer_copy_approved` is `true`, the app shows a legal-review blocker — **not** the draft attestation below.

## Purpose

Record verifiable **parent/guardian authority** before creating a student profile or enrolling a minor in a coach class. Support deletion and data-access requests.

North-star: **Parent attests → consent stored → student profile can be created.**

## Required states

| State | Must show |
|-------|-----------|
| **Attestation** | Checkbox + plain-language guardian statement |
| **Consent recorded** | Timestamp, parent_user_id, policy version |
| **Declined** | Cannot create student profile |
| **Delete student** | Parent confirms; data removed per retention policy |
| **Export** | Parent can request/export student-related data (H* format) |

### Attestation copy (draft — lawyer must approve)

> **NOT SHIPPED IN APP.** Draft for counsel review only:

```text
I confirm I am this student's parent or legal guardian,
or I am authorized to manage this student profile.
```

## Pass/fail checklist

### Legal blocker (production minors)
- [x] When `lawyer_copy_approved` is `false`, app shows **legal-review blocker** — not draft attestation copy
- [x] Cannot create student profile without approved consent flow
- [ ] User cannot bypass blocker via deep link, flag, or API-only path
- [ ] Tier-1 Validator: parent flow **pass** when consent screen or legal blocker reached — not when child row exists in DB — **Pass 2026-06-22** via fresh adult inline add

### Attestation (when lawyer approves)
- [x] Cannot create student profile without attestation
- [x] Consent version string stored (e.g. `guardian-v1-2026-06`)
- [x] **Declined** attestation blocks profile create — no silent skip
- [x] Privacy policy link visible at attestation (when copy approved)

### Withdrawal + deletion
- [x] Parent can delete student profile and enrollments
- [x] **Consent withdrawal** revokes active consents (`revokeGuardianConsentsForStudent`)
- [ ] Deletion removes or anonymizes per retention policy (H2 lawyer)
- [ ] Export request path documented (H* format) — parent can request student data

### Safety
- [x] No child email collected for under-13 in v1
- [ ] Audit log: consent granted, revoked, deletion

## Screenshots required

`docs/contracts/screenshots/flow-parent-guardian-consent/`

| File | State |
|------|-------|
| `01-legal-review-blocker.png` | Pending legal review — no draft copy in UI |

## Validator report

| Item | Pass | Notes |
|------|------|-------|
| No draft copy shipped | Pass | `GUARDIAN_ATTESTATION_COPY = null` |
| Create blocked without consent | Pass | Legal blocker + service guards |
| Consent version in DB | Pass | `guardian_consents.policy_version` |
| Archive + revoke | Pass | `archiveStudentProfile` + `revokeGuardianConsentsForStudent` |
| Full attestation UI | Blocked | H1 lawyer — `01-legal-review-blocker.png` |
| Retention on delete | Pending | H2 lawyer |
| Analytics audit | Pending | consent events not wired |

## Human decision gates (H*)

| ID | Question | Owner |
|----|----------|-------|
| H1 | COPPA verifiable consent mechanism | Lawyer |
| H2 | Data retention period after delete | Lawyer |
| H3 | Regional variants (CA, EU minors) | Lawyer |
| H4 | Photo/media consent separate checkbox? | Product + lawyer |

## Legal (not legal advice)

See [parent-student-coach-safety-design.md](../coach-parent-student/parent-student-coach-safety-design.md) § legal concerns.

**No production launch of kid classes until H1 resolved.**

## Out of scope

- Electronic signature vendors
- School/district bulk consent

## Related

- [module-student-profile.md](./module-student-profile.md)
- [flow-student-class-enrollment.md](./flow-student-class-enrollment.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-21 | Lawyer gate is **expected tier-1 stop** — not builder work; mention in TestFlight notes | Legal / Founder |
| 2026-06-15 | Lawyer review not started | Founder |
