# Product review — parent-via-class-invite · 2026-06-22 (tier 3 expert)

## Persona

**Role:** R3 — Parent via class invite  
**Goal:** Re-verify invite path after tier 2 B7/B1/B5 fixes  
**Contract:** [flow-student-class-enrollment.md](../../contracts/flow-student-class-enrollment.md)  
**Queue:** `onboarding-round3-expert` tier 3

## Setup

| Item | Value |
|------|-------|
| Tier 2 fixes | B7 legal gate, B1 `age_category`, B5 `returnToInvite`, B9 teen block |
| Reference | Tier 2 review used DB parent with `age_category` set |

---

## Journey summary

| Step | Tier 2 | Tier 3 expert | Result |
|------|--------|---------------|--------|
| Fresh signup → legal gate | **Blocked** (B7) | **Fixed** in PR #47 | **Pass** (tier 2 validation proved) |
| Class invite → child picker | **Pass** (seeded parent) | Code unchanged — `returnToInvite` wired | **Pass** (carry) |
| Inline Add Child → consent | Stops at lawyer gate | Same — **legal review in progress** | **Documented stop** |
| `returnToInvite` after consent | Not reached | Still blocked by lawyer gate — cannot E2E enroll | **N/A** until counsel |
| Teen class invite | Alert on submit | **B9** — block/hide before form | **Pass** (code) |

---

## Friction

| P | Issue | Severity | Notes |
|---|-------|----------|-------|
| P2 | Full fresh-parent enroll E2E | Blocked | Guardian consent lawyer gate — not app bug |
| P3 | `returnToInvite` resume | Unverified E2E | Blocked by same gate |

## Recommended contract changes

- No new P0/P1; keep guardian consent as explicit validation stop.
- Tier 3 note: when lawyer approves, re-run `returnToInvite` E2E as first validation row.
