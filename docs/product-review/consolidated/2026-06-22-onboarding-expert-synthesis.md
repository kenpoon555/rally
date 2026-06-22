# Product review synthesis — 2026-06-22 · onboarding-expert

**Queue:** `onboarding-round3-expert` tier 3 · **Tag:** `onboarding-expert` · **Validation queue:** `cps-onboarding`  
**Consolidator:** product-review-consolidator · **Reviews:** 4/4 complete  
**Prior round:** [2026-06-22-onboarding-picky-synthesis.md](./2026-06-22-onboarding-picky-synthesis.md) (tier 2) · B7–B9 shipped in PR #47

## Reviews included

| persona-id | date | file |
|------------|------|------|
| `coach-parent-dual` | 2026-06-22 | [../coach-parent-dual/2026-06-22-review.md](../coach-parent-dual/2026-06-22-review.md) |
| `academy-head-coach` | 2026-06-22 | [../academy-head-coach/2026-06-22-review.md](../academy-head-coach/2026-06-22-review.md) |
| `coach-first-class` | 2026-06-22 | [../coach-first-class/2026-06-22-tier3-review.md](../coach-first-class/2026-06-22-tier3-review.md) |
| `parent-via-class-invite` | 2026-06-22 | [../parent-via-class-invite/2026-06-22-tier3-review.md](../parent-via-class-invite/2026-06-22-tier3-review.md) |

## Executive summary

Tier 3 expert confirms **tier 2 builder fixes hold** on `dev` after PR #47 merge. No new P0/P1 ship blockers.

**Passes:** Dual-role Marcus regression (Family + Coach Tools + Today blocks); v1 org boundary (no academy UI, no substitute); B8 coach class listing path (DB + code); parent invite path carry with lawyer gate documented.

**P2 only:** Sim E2E screenshot for non-Marcus coach class publish; dual-role depth still Marcus-seeded; Create screen title copy polish.

**Known v1 stop (unchanged):** Guardian consent lawyer gate — blocks full `returnToInvite` E2E enroll.

---

## Top pain themes (ranked)

| Rank | Theme | Personas (n) | Severity | Notes |
|------|-------|--------------|----------|-------|
| 1 | **Coach-first sim proof depth** — B8 fixed in code/DB, sim E2E not re-captured | 1/4 (`coach-first-class`) | **P2** | `@playerr0474532` listing exists; ClassDetail share screenshot deferred |
| 2 | **Dual-role demo depends on Marcus seed** | 1/4 (`coach-parent-dual`) | **P2** | Sections distinct; fresh dual-role account not proven |
| 3 | **Guardian consent lawyer gate** — blocks enroll E2E | 1/4 (`parent-via-class-invite`) | **Documented stop** | Not app regression |
| 4 | **Create Game header in class mode** | 2/4 | **P3** | Copy polish |
| 5 | **v2 org gaps** — expected unbuilt | 1/4 (`academy-head-coach`) | **v2 track** | v1 boundary pass |

## Regressions fixed vs tier 2 (do not re-break)

| Fix | Verified by | Tier 3 result |
|-----|-------------|---------------|
| B7 Legal gate error UX | tier 2 validation | **Carry green** — no fresh P0 |
| B8 Coach class publish | `coach-first-class` | **Pass** (DB/code); sim proof P2 |
| B5 `returnToInvite` wiring | `parent-via-class-invite` | **Pass** (code); E2E blocked by lawyer |
| B9 Teen class invite block | carry from tier 2 | **Pass** (code) |
| B6 Marcus hardcode removal | `coach-parent-dual` | **Pass** — dual sections on Marcus |

---

## Recommended contract changes

| Priority | Contract file | Change type | Proposed diff summary |
|----------|---------------|-------------|----------------------|
| P2 | `flow-create-game.md` | Open issue + checklist | Mark B8 implemented; tier 3 requires sim ClassDetail proof for non-Marcus coach |
| P2 | `module-coach-parent-navigation.md` | Regression note | Tier 3 dual-role Marcus regression row |
| P2 | `flow-organization-coaches.md` | v1 boundary checked | Tier 3 validator note — boundary-only until v2 |
| P3 | `flow-student-class-enrollment.md` | Validator note | Re-run `returnToInvite` E2E when lawyer approves |
| — | `flow-coach-class-operations.md` | No change | v1.4 green; substitute remains v2 |

**Contract files to touch:** 3–4 files. **No `src/` in consolidator step.**

---

## Builder backlog (Layer 2 → Builder agent)

See: [2026-06-22-onboarding-expert-builder-backlog.md](./2026-06-22-onboarding-expert-builder-backlog.md)

**No new P0/P1 items.** Tier 3 is docs + regression validation on `dev`.

| Priority | Item | Notes |
|----------|------|-------|
| — | *(none)* | P2/P3 tracked in validation handoff only |

---

## Validation handoff (Layer 3)

See: [2026-06-22-onboarding-expert-validation-handoff.md](./2026-06-22-onboarding-expert-validation-handoff.md)

**Start:** Regression spot-check on `dev` — no new builder branch required unless human adds scope.

---

## Out of scope (this cycle)

- v2 org / academy UI (`flow-organization-coaches`)
- Substitute coach / consolidate (v1.5+)
- Lawyer approval for guardian consent E2E
- Fresh dual-role account seed script (optional QA tooling)

## Human decision gates (H*)

| ID | Question | Tier 3 recommendation |
|----|----------|-------------------------|
| H1 | Skip builder when backlog empty? | **A** — validation regression on `dev` only |
| H2 | Require sim ClassDetail proof for B8? | **A** — add to validation handoff as P2 proof row |
