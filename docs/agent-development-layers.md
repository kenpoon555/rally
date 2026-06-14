# Rally agent development layers

**Last updated:** 2026-06-15  
**Doc index (read this first):** [DOCS-INDEX.md](./DOCS-INDEX.md) — grouped by layer/topic; agents search by task keyword.

**Related:** [VALIDATION-RUNBOOK.md](./contracts/VALIDATION-RUNBOOK.md) · [post-v1-roadmap-contracts.md](./post-v1-roadmap-contracts.md)

This doc is the map for how Rally uses agents, contracts, and human gates as the product grows toward autopilot.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 1 — PRODUCT REVIEW                                               │
│  Persona agents (sport × commitment) → review.md + screenshots          │
│  Consolidator agent → pain themes → proposed contract diffs             │
│  Human approves product direction                                       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 2 — AUTHOR CONTRACT                                              │
│  write-contract skill → docs/contracts/*.md                             │
│  Performance · deps · human gates · monthly cost estimate               │
│  Docs-only PR to dev                                                    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 3 — PROOF (validation chain)                                     │
│  validation-loop-start.sh → Validator → Fixer → Validator (one chat)    │
│  Hook chains Fixer only on fail; stops on pass / human / external     │
│  Optional Builder when contract says missing                           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 4 — SHIP                                                         │
│  promote-branch · TestFlight / Play · production merge · EAS           │
│  Human merge gate; CI npm verify                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Rule:** Layers flow downward. Never skip Layer 2 (contract) before Builder. Never skip Layer 3 (validation) before production.

---

## Layer 1 — Product review

**Question:** *Should we build or change this? Would real players want it?*

| Piece | Location |
|-------|----------|
| Persona catalog (10+ sports × commitment) | [product-review/personas.md](./product-review/personas.md) |
| Review skill | `.cursor/skills/product-review/SKILL.md` |
| Consolidator skill | `.cursor/skills/product-review-consolidator/SKILL.md` |
| Workflow | `.cursor/workflows/product-review.md` · `consolidate-product-reviews.md` |
| Outputs | `docs/product-review/{persona-id}/` |

**Agents:**

1. **Persona reviewer** — one persona per session; sim walkthrough; friction table; no code
2. **Consolidator** — reads all `*-review.md`; ranks pain by frequency/severity; drafts contract updates

**Human gate:** Approve consolidator output before Layer 2.

**Not wired to validation hook.**

---

## Layer 2 — Author contract

**Question:** *What exactly must the app do? How do we test it? What does it cost?*

| Piece | Location |
|-------|----------|
| Skill | `.cursor/skills/write-contract/SKILL.md` |
| Workflow | `.cursor/workflows/author-contract.md` |
| Contracts | `docs/contracts/*.md` |
| Index | `docs/post-v1-roadmap-contracts.md` |

**Contract must include:**

- Observable pass/fail checklist
- Performance budgets (P*)
- External dependencies (E*)
- Human decision gates (H*)
- **Estimated monthly cost** (C*) for the change at 50 / 200 MAU

**Human gate:** Docs-only PR review; resolve H* gates before Builder.

---

## Layer 3 — Proof (validation chain)

**Question:** *Does the build match the contract?*

| Piece | Location |
|-------|----------|
| Workflow | `.cursor/workflows/validate-contract.md` |
| Runbook | `docs/contracts/VALIDATION-RUNBOOK.md` |
| Start chain | `./.cursor/hooks/validation-loop-start.sh {contract-id}` |
| Hook | `.cursor/hooks/contract-validation-chain.py` |
| Session state | `docs/contracts/.validation-session.json` (gitignored) |

**Agents (one chat, hook-orchestrated):**

| Role | Edits code? | When |
|------|-------------|------|
| **Validator** | No | Always first |
| **Fixer** | Yes — failed rows only | After `fail` |
| **Builder** | Yes — full gap | After `needs_builder` (+ `--builder`) |

**Chain stops (asks human):**

| Status | Meaning |
|--------|---------|
| `pass` | VALIDATION_GREEN |
| `needs_human` | Undecided H* gate |
| `blocked_external` | Supabase / seed / device down |
| `max_fixer_rounds` | Same bug after 3 Fixer passes |
| `needs_builder` | Missing feature (pause unless `--builder`) |

**One loop engine, many contracts** — swap contract id after each green.

---

## Layer 4 — Ship

**Question:** *Is it safe to release to real users?*

| Piece | Location |
|-------|----------|
| Feature workflow | `.cursor/workflows/ship-feature.md` |
| Branch pipeline | `.cursor/workflows/promote-branch.md` |
| Supabase deploy | `.cursor/workflows/deploy-supabase.md` |
| CI | `.github/workflows/` |

**Human gates:** PR review · preview → main → production · App Store / Play review.

Validation green on affected contracts **before** production merge.

---

## Loop inventory

| Loop | Layer | Automated hook? |
|------|-------|-----------------|
| Persona product review | 1 | No |
| Review consolidator | 1 | No |
| Author / update contract | 2 | No |
| Validation chain (Validator → Fixer) | 3 | **Yes** (`stop` hook) |
| `/loop` regression watch | 3 | Optional interval; Validator only |
| Ship / promote | 4 | GitHub Actions only |

---

## Cost and stability discipline

| Risk | Mitigation |
|------|------------|
| Token spend | One validation chain at a time; consolidator batches reviews |
| Wrong autopilot behavior | Contracts + H* gates + Layer 1 before Layer 2 |
| Agent context bloat | New Agent chat per contract after green (same hook pattern) |
| Parallel Fixers | One active `chain_enabled` session |
| Infra surprise | C* cost block in every contract change |

**Rough infra baseline (50 MAU):** Supabase free tier or Pro ~$25/mo when branching needed; variable ~$0.01–0.05/MAU for active crews. See contract `## Estimated monthly cost` for per-feature deltas.

---

## Quick start commands

```bash
# Layer 1 — persona review (one persona per Agent session)
# See docs/product-review/personas.md for persona-id

# Layer 1 — consolidate after ≥3 reviews
# Agent: consolidate per .cursor/skills/product-review-consolidator/SKILL.md

# Layer 2 — human merges contract PR

# Layer 3 — proof
./.cursor/hooks/validation-loop-start.sh flow-rally-session
# Agent: run script + Validator same turn

# Layer 4 — ship
# promote-branch workflow
```

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [advisoragent.md](../advisoragent.md) | Original contract-loop strategy |
| [vision.md](./vision.md) | Product north star |
| [validation-queue.md](./contracts/validation-queue.md) | Sprint validation order |
