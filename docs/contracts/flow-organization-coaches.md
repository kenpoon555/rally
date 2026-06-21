# Flow — Organization & multiple coaches (v2)

**Contract id:** `flow-organization-coaches`  
**Status:** Stub — **not built** · document-only until v2.0 release track  
**Track:** v2.0 academy · [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md)  
**Related code:** None shipped — org model deferred

## Purpose

An **academy or club** has multiple coaches under one organization. A **head coach** can invite coaches, assign classes, and **reassign a session to a substitute** when someone is on vacation.

North-star (v2): **Head coach on PTO → assigns substitute → parents see same class, new coach name → roster unchanged.**

## v1 boundary (validate absence)

- [ ] No org admin UI in production build
- [ ] No “transfer class to another coach” button
- [ ] Solo coach defer/cancel only — [flow-coach-class-operations.md](./flow-coach-class-operations.md)
- [ ] Product copy does not promise academy features

## v2 required states (stub — Builder when scoped)

| State | Actor | Must show |
|-------|-------|-----------|
| **Create org** | Founder / admin | Org name, sport, billing contact |
| **Invite coach** | Org admin | Email invite → coach joins org |
| **Coach in org** | Coach | Sees org classes + own classes |
| **Assign class owner** | Head coach | Pick coach for session series |
| **Reassign session** | Head coach | Substitute coach; parent notify |
| **Parent view** | Parent | Same class card; updated coach name |
| **Remove coach** | Admin | Classes reassigned or archived |

## Pass/fail checklist (v2 — not runnable today)

- [ ] Two coaches same org both see shared org roster policy
- [ ] Reassign does not duplicate enrollments
- [ ] Parent notified on substitute assignment
- [ ] Coach removed from org loses access to org classes only
- [ ] RLS: coach A cannot read org B classes

## Performance requirements

| ID | Metric | Budget |
|----|--------|--------|
| P1 | Reassign + notify | < 5s p95 |

## Estimated monthly cost

**Δ @ 50 MAU:** TBD — org table + membership rows ~$0.  
**Δ @ 200 MAU:** +$0–5 query growth.  
**Human gate if org billing added:** yes.

## Human decision gates (H*)

| ID | Question |
|----|----------|
| H1 | Org entity legal structure (LLC vs individual coaches)? |
| H2 | Can solo coaches later join an org without migrating classes? |
| H3 | Stripe Connect per org vs per coach? |

## Screenshots required (v2)

`docs/contracts/screenshots/flow-organization-coaches/` — TBD when built.

## Out of scope (v2 doc)

- In-app payments split
- Background checks per coach
- Franchise multi-location

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-15 | Entire flow unbuilt — v2.0 per release track | Product |

## Related

- [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md)
- [release-track.md](../coach-parent-student/release-track.md)

## Validator report

| Item | Pass | Notes |
|------|------|-------|
| v1 absence | | Run v1 boundary checklist only |
