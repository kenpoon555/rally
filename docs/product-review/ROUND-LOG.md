# Release round log — product review → contracts → builder → proof

**Purpose:** One place to see **each round**, **what it fixed**, and **where we are** in the master loop.  
**Config:** [release-loops.json](../release-loops.json) · **Queues:** [review-queues.json](./review-queues.json) · **Process:** [MASTER-LOOP.md](./MASTER-LOOP.md)

**Live status (orchestrator chat):** run `./.cursor/hooks/rally-loop-status.sh` or open [LOOP-STATUS.md](../LOOP-STATUS.md).  
When a phase finishes, the headline shows **PHASE COMPLETE** or **PAUSED** — then say **continue** in this chat.

Update this file when a round finishes consolidator, merges contract/src PRs, or clears validation.

---

## Process (every round)

```text
Personas (Layer 1) → Consolidator → Pre-approve → [human if blocked]
  → Contract PR (docs, merge dev)
  → Builder (local branch, NO src PR until proof)
  → Validation queue (sim + contracts)
  → Src PR merge
  → Next round (optional tier 2 / parallel track)
```

| Layer | Output | Human gate |
|-------|--------|------------|
| L1 | `*-review.md`, `*-synthesis.md`, `*-builder-backlog.md` | Pre-approve / auto-pass |
| L2a | `docs/contracts/` PR | Merge contract PR |
| L2b | `src/` on feature branch | — |
| L3 | Validator pass/fail per contract | Merge src PR after green |
| L4 | TestFlight / promote | Ship |

---

## Round index

| Round id | Release loop | Tier | Personas | Validation queue | Status |
|----------|--------------|------|----------|------------------|--------|
| **onboarding-round1** | onboarding-v1 | 1 | 6/6 | `cps-onboarding` | 🟡 **Validation 2/8** · src PR draft |
| onboarding-round2-picky | onboarding-v1 | 2 | 0/6 | `cps-onboarding` | ⬜ After round 1 green |
| onboarding-round3-expert | onboarding-v1 | 3 | 0/4 | `cps-onboarding` | ⬜ After tier 2 |
| pickup-round1 | pickup-gtm2 | 1 | 0/6 | `gtm2-feedback-jun-2026` | ⬜ Not started |
| pickup-round2-picky | pickup-gtm2 | 2 | 0/4 | `gtm2-feedback-jun-2026` | ⬜ Blocked |
| sport-meetup | sport-meetup | — | optional `running-regular` | `sport-meetup-launch` | ⬜ After onboarding-v1 path |

---

## Round 1 — `onboarding-round1` (tier 1 · discovery)

**Dates:** 2026-06-21 · **Tag:** `onboarding`  
**Personas (6/6):** `player-no-coach-tools`, `coach-approved-manual`, `parent-first-child`, `parent-via-class-invite`, `coach-parent-dual`, `teen-restricted-account`

### Artifacts

| Artifact | Path |
|----------|------|
| Synthesis | [consolidated/2026-06-21-onboarding-synthesis.md](./consolidated/2026-06-21-onboarding-synthesis.md) |
| Pre-approve | [consolidated/2026-06-21-onboarding-pre-approve-review.md](./consolidated/2026-06-21-onboarding-pre-approve-review.md) |
| Builder backlog | [consolidated/2026-06-21-onboarding-builder-backlog.md](./consolidated/2026-06-21-onboarding-builder-backlog.md) |
| Validation handoff | [consolidated/2026-06-21-onboarding-validation-handoff.md](./consolidated/2026-06-21-onboarding-validation-handoff.md) |

### Human decisions (locked)

| Gate | Choice |
|------|--------|
| R1 — Profile Family when flag on + zero children | **A: Yes** (Profile-first) |
| R2 — Primary parent entry | **A: Fix Family visibility** |
| R3 — Teen erroneous `is_coach` | **A: Force-hide coach surfaces** |

### Major fixes (this round)

| ID | Priority | Fix | Builder | Validation contract |
|----|----------|-----|---------|---------------------|
| **B1** | P0 | Persist `profiles.age_category` on signup (+ metadata backfill) | `AuthContext`, `userService` | `flow-age-gate-onboarding` |
| **B2** | P0 | Show Profile Family when parent flags on + zero children | `coachParentService` | `flow-parent-family-onboarding` |
| **B3** | P0 | Force-hide coach surfaces for teens (H2) | `coachParentService`, `DynamicHomeScreen` | `flow-teen-account-onboarding` |
| **B4** | P1 | Gate Today MY CLASSES by parent intent | `useCoachParent`, `DynamicHomeScreen` | `flow-coach-onboarding-org` |
| **B5** | P1 | Honor `returnToInvite` after inline Add Child | `AddChildProfileScreen` | `flow-student-class-enrollment` |
| **B6** | P1 | Remove Marcus ID hardcode from role visibility | `coachParentService` | `module-coach-parent-navigation` |

**Documented stops (not builder):** guardian lawyer gate blocks full child create/enroll; coach approval requires relaunch (v1); no in-app Become a coach (v2).

**Deferred (not this round):** B7 relaunch doc · B8 dev rows · B9 invite coach name · Create Game header (P3).

### PRs & proof

| Step | PR / branch | Status |
|------|-------------|--------|
| Contracts | [#44](https://github.com/kenpoon555/rally/pull/44) → `dev` | ✅ Merged |
| Src | [#45](https://github.com/kenpoon555/rally/pull/45) `fix/onboarding-builder-b1-b6` | 🟡 Draft — merge after local green |
| Validation | `cps-onboarding` (8 contracts) | 🟡 **3/8 queued** (2 green) |

### Validation checklist (cps-onboarding)

| # | Contract | Validator |
|---|----------|-----------|
| 1 | `flow-age-gate-onboarding` | ✅ green 2026-06-22 (B1 DB + UI) |
| 2 | `flow-parent-family-onboarding` | ✅ green 2026-06-22 (B2 Family + consent blocker) |
| 3 | `flow-teen-account-onboarding` | 🔄 queued |
| 4 | `flow-student-class-enrollment` | ⬜ |
| 5 | `flow-parent-guardian-consent` | ⬜ |
| 6 | `flow-become-a-coach` | ⬜ |
| 7 | `flow-coach-onboarding-org` | ⬜ |
| 8 | `module-coach-parent-navigation` | ⬜ |

**Exit criteria:** All 8 green (or documented legal stop) → `product-review-loop-validation-green.sh` → merge #45 → start tier 2.

---

## Round 2 — `onboarding-round2-picky` (tier 2 · picky)

**Status:** ⬜ Not started · **Requires:** round 1 validation green  
**Personas (0/6):** same as tier 1 except `coach-parent-dual` → **`coach-first-class`**

### Expected focus (from queue config)

- Complete journeys **without founder/DB help** (except contract-documented manual steps)
- Silent failures = **P0**
- Stricter re-check: parent paths, teen H2 probe, coach first class + invite share

### Major fixes

| ID | Fix | Status |
|----|-----|--------|
| — | *Fill after consolidator* | — |

---

## Round 3 — `onboarding-round3-expert` (tier 3 · expert)

**Status:** ⬜ Not started · **Requires:** tier 2 green  
**Personas (0/4):** `coach-parent-dual`, `academy-head-coach`, `coach-first-class`, `parent-via-class-invite`

### Expected focus

- Org/academy gaps (v2 stubs)
- Dual-role regression after Marcus hardcode removal
- Edge cases vs tier 2

### Major fixes

| ID | Fix | Status |
|----|-----|--------|
| — | *Fill after consolidator* | — |

---

## Parallel track — `pickup-round1` (GTM 2 feedback)

**Status:** ⬜ Not started · **Personas (0/6):** basketball/badminton/pickleball/volleyball hosts + first-timers  
**Validation:** `gtm2-feedback-jun-2026`

### Major fixes

| ID | Fix | Status |
|----|-----|--------|
| — | *Fill after consolidator* | — |

---

## Parallel track — `sport-meetup` (Running + Workout)

**Status:** ⬜ Not started · **After:** onboarding-v1 path (or explicit parallel)  
**Optional persona:** `running-regular` · **Validation:** `sport-meetup-launch`

### Expected major work

| Area | Contract |
|------|----------|
| Running + Workout meetup create (ballpark area, not court) | `module-sport-meetup-sports` |
| Game modes for meetup sports | `module-sport-game-modes` |
| Create flow + icons | `flow-create-game`, `module-sport-icon` |

**Human gate first:** `module-sport-meetup-sports` H1–H4

### Major fixes

| ID | Fix | Status |
|----|-----|--------|
| — | *Fill after contract + builder* | — |

---

## How to add a row when a round completes

1. Run consolidator → copy **Top pain themes** into **Major fixes** (P0/P1 only for summary).
2. Link builder backlog IDs (B1, B2, …) and PR numbers.
3. When validation green, mark contracts ✅ and date in contract `Last validated` lines.
4. Set round **Status** in index table to ✅ or link to tier 2 start.

**Consolidator template for next round:**

```markdown
### Major fixes (this round)
| ID | Priority | Fix | Builder | Validation |
|----|----------|-----|---------|------------|
| B1 | P0 | … | files | contract-id |
```
