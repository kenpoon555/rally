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
| onboarding-round1 | onboarding-v1 | 1 | 6/6 | `cps-onboarding` | ✅ Complete |
| onboarding-round2-picky | onboarding-v1 | 2 | 6/6 | `cps-onboarding` | ✅ Complete · PR [#47](https://github.com/kenpoon555/rally/pull/47) |
| onboarding-round3-expert | onboarding-v1 | 3 | 4/4 | tier3 regression | ✅ Complete · PR [#48](https://github.com/kenpoon555/rally/pull/48) · docs-only |
| pickup-round1 | pickup-gtm2 | 1 | 6/6 | `gtm2-feedback-jun-2026` | ✅ Complete · validation in #53 |
| pickup-round2-picky | pickup-gtm2 | 2 | 4/4 | `gtm2-feedback-jun-2026` | ✅ Complete · PR [#53](https://github.com/kenpoon555/rally/pull/53) |
| sport-meetup | sport-meetup | — | 1/1 | `sport-meetup-launch` | ✅ Complete · PR [#54](https://github.com/kenpoon555/rally/pull/54) |
| **overnight-batch-jun-2026** | overnight-batch | — | — | `baseline` (+ prior queues) | ✅ Complete · PR [#55](https://github.com/kenpoon555/rally/pull/55) |
| **phase-validation-jun-2026** | — | — | — | `phase1a`–`ops` | ✅ Complete · PR [#56](https://github.com/kenpoon555/rally/pull/56) |
| **play-discover-round1** | play-discover-jun-2026 | 1 | 6/6 | `role-surface-audit` | ✅ L1 complete — consolidator + pre-approve `approve_with_notes` |

---

## Onboarding-v1 — complete (tiers 1–3)

### Tier 1 — `onboarding-round1` · 2026-06-21

**Tag:** `onboarding` · **Personas:** 6/6

| ID | Fix | Priority |
|----|-----|----------|
| B1 | Persist `age_category` on signup | P0 |
| B2 | Profile Family when flag on + zero children | P0 |
| B3 | Force-hide coach surfaces for teens | P0 |
| B4 | Gate Today MY CLASSES | P1 |
| B5 | `returnToInvite` after Add Child | P1 |
| B6 | Remove Marcus hardcode from role visibility | P1 |

**PRs:** Contracts [#44](https://github.com/kenpoon555/rally/pull/44) · Src [#45](https://github.com/kenpoon555/rally/pull/45) (superseded by tier 2 builder)

### Tier 2 — `onboarding-round2-picky` · 2026-06-22

**Tag:** `onboarding-picky` · **Personas:** 6/6 · **Validation:** 9/9 `cps-onboarding` green

| ID | Fix | Priority |
|----|-----|----------|
| B7 | Legal gate error UX (`TosAcceptanceGate`) | P0 |
| B8 | Coach class publish → `coach_class_listings` | P1 |
| B9 | Teen block Add Child on class invite | P2 |

**PR:** [#47](https://github.com/kenpoon555/rally/pull/47) `fix/onboarding-picky-builder` → merged `dev`

### Tier 3 — `onboarding-round3-expert` · 2026-06-22

**Tag:** `onboarding-expert` · **Personas:** 4/4 · **Builder:** none (regression only)

**PR:** [#48](https://github.com/kenpoon555/rally/pull/48) docs-only · **Validation:** 6/6 tier3 regression on `dev`

**Carry (P2):** `@playerr0474532` ClassDetail share sim screenshot · lawyer guardian gate · v2 org stub

**Documented stops:** guardian lawyer gate; coach approval relaunch; no in-app Become a coach (v2).

---

## Pickup GTM2 — complete (tiers 1–2)

### Tier 1 — `pickup-round1` · 2026-06-22

**Tag:** `pickup` · **Personas:** 6/6 · **Validation:** `gtm2-feedback-jun-2026` (with tier 2 picky builder)

**P0 fixes:** B1 deep links · B2 schedule spinner · invite/auth handoff · login timeout

**PR:** [#53](https://github.com/kenpoon555/rally/pull/53) `fix/pickup-picky-builder` → merged `dev`

### Tier 2 — `pickup-round2-picky` · 2026-06-22

**Tag:** `pickup-picky` · **Personas:** 4/4 · Shipped in same PR [#53](https://github.com/kenpoon555/rally/pull/53)

---

## Sport meetup — complete

**Track:** `sport-meetup` · **Persona:** `running-regular` · **Validation:** `sport-meetup-launch` 4/4 green

**P0:** SM1 Running meetup create (no court gate) · `miniTournamentEnabled: false` for Running/Workout

**PR:** [#54](https://github.com/kenpoon555/rally/pull/54) → merged `dev`

---

## Overnight batch — complete · 2026-06-22

**Loop:** `overnight-batch-jun-2026` · **Mode:** `batch_pr` (one combined PR)

**Validation queues (all green on `dev`):**

| Queue | PR / note |
|-------|-----------|
| `gtm2-feedback-jun-2026` | #53 |
| `sport-meetup-launch` | #54 |
| `cps-onboarding` | prior onboarding rounds |
| `baseline` | #55 — invite, rally-session, hub, inbox, play |

**PR:** [#55](https://github.com/kenpoon555/rally/pull/55) `fix/overnight-jun-2026-batch` → merged `dev`

**Skipped (human/device):** `flow-push-notifications-device`

**Follow-up:** Re-seed Monrovia demo before re-running I'm-in / lock roster rows — `./scripts/seed-monrovia-linked.sh`

---

## Phase validation — complete · 2026-06-22

**Not a product-review round** — sim validation of shipped retention features + GTM 2 analytics scorecard.

| Queue | Status |
|-------|--------|
| `phase1a`–`ops` | Documented on `dev` (sim + RPC; device N/T noted) |
| `module-analytics-events` | GTM 2 scorecard events wired |

**Also on branch:** poll chat scroll fix, crew `/members` deep link, validation screenshots.

---

## Next validation queues (optional / device)

See [PHASE-VALIDATION-STATUS.md](../contracts/PHASE-VALIDATION-STATUS.md).

**Device N/T:** `flow-push-notifications-device`, `gtm1-launch-gate`, mini-tournament two-account QA.

**Next product-review loop:** `play-discover-round1` (sport×segment + role surfaces) — start with:

```bash
./.cursor/hooks/product-review-loop-start.sh --queue play-discover-round1
```

Then validate: `./.cursor/hooks/validation-loop-start.sh --queue role-surface-audit --from module-role-surfaces`

Coach/parent `v1.1`–`v1.4` tracks remain when scoped separately.

---

## How to add a row when a round completes

1. Run consolidator → copy **Top pain themes** into **Major fixes** (P0/P1 only for summary).
2. Link builder backlog IDs (B1, B2, …) and PR numbers.
3. When validation green, mark contracts ✅ and date in contract `Last validated` lines.
4. Set round **Status** in index table to ✅ or link to tier 2 start.
