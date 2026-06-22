---
name: pre-approve-review
description: >-
  Reviews consolidator output before human approval — checks persona coverage,
  contract PR risk, GTM/launch conflicts, and missing H gates. Use after
  consolidator, before product-review-loop-approve.sh. Does not edit src/.
---

# Pre-approve review (Layer 1.5)

**Question:** *Can the human approve this consolidator pack with confidence?*

Runs **after** consolidator · **before** human gate · **before** contract PR merge.

| Role | May edit |
|------|----------|
| Consolidator | synthesis, proposed contract diffs, backlog |
| **Pre-approve reviewer (this)** | `*-pre-approve-review.md` only; optional **minor** contract clarifications if blocking ambiguity |
| Human | approve / reject / send back |

**Do not** run Validator. **Do not** edit `src/` unless user explicitly asks.

## When to run

- Consolidator finished: `*-synthesis.md`, `*-builder-backlog.md`, `*-validation-handoff.md` exist
- Session phase `review_pending` or user asks "pre-approve review"

## Inputs

```
docs/product-review/consolidated/YYYY-MM-DD-{tag}-synthesis.md
docs/product-review/consolidated/YYYY-MM-DD-{tag}-builder-backlog.md
docs/product-review/consolidated/YYYY-MM-DD-{tag}-validation-handoff.md
docs/product-review/{persona-id}/*-review.md          (source reviews for this queue)
docs/contracts/*.md                                   (targets of proposed diffs)
docs/launch-roadmap-jun-2026.md
docs/post-v1-roadmap-contracts.md
docs/release-loops.json
```

## Procedure

### 1. Coverage — do we fulfill persona needs?

For each persona in the queue session:

| Check | Fail if |
|-------|---------|
| Every P0/P1 friction in persona review appears in synthesis or backlog | Theme dropped silently |
| Blockers (legal, age_category, etc.) have contract row or H gate | "Fix later" with no spec |
| Builder backlog P0 matches synthesis top themes | Orphan backlog items |
| Validation handoff includes contracts for each P0 theme | Proof gap |

### 2. Contract PR risk — breaking or risky?

| Check | Flag |
|-------|------|
| Proposed diffs contradict existing green contracts | **conflict** |
| New checklist rows are observable (Validator can test) | **vague** |
| Scope creep (features not in any persona review) | **creep** |
| Missing H* for ambiguous product choice | **missing H gate** |
| CPS / lawyer gates respected (`flow-parent-guardian-consent`) | **legal** |
| GTM 2 gate: large scope during launch week | **timing** |
| Estimated cost block present if new infra | **cost** |

### 3. Concerns to add before human approves

List anything the human should read before clicking approve:

- Risks consolidator under-weighted
- Suggested extra checklist rows (wording only — do not merge without human)
- Order change for validation handoff
- "Approve synthesis but split contract PR into two PRs"

### 4. Verdict

| Verdict | Meaning | Session status |
|---------|---------|----------------|
| **approve_ready** | Human can approve; minor notes OK | `awaiting_human` |
| **approve_with_notes** | Approve if human accepts listed notes | `awaiting_human` |
| **revise_consolidator** | Send back — missing themes or bad contract diffs | `needs_revision` |
| **block** | Do not approve — legal/GTM/conflict | `blocked` |

### 5. Write output

`docs/product-review/consolidated/YYYY-MM-DD-{tag}-pre-approve-review.md`:

```markdown
# Pre-approve review — {tag} · YYYY-MM-DD

## Verdict
**approve_ready** | approve_with_notes | revise_consolidator | block

## Coverage (persona → synthesis)
| persona-id | P0/P1 themes | In synthesis? | In backlog? | Gap |

## Contract PR risk
| File | Change | Risk | Recommendation |

## Concerns for human (read before approve)
- …

## Suggested additions (optional)
- Contract row: …
- H gate: …

## Human approve checklist
- [ ] I accept verdict: …
- [ ] Contract PR scope: …
```

Update `.product-review-session.json`:

```json
{
  "phase": "review_done",
  "status": "awaiting_human",
  "pre_approve_verdict": "approve_ready",
  "pre_approve_review_path": "docs/product-review/consolidated/…-pre-approve-review.md"
}
```

If **revise_consolidator** or **block**:

```json
{
  "phase": "review_done",
  "status": "needs_revision",
  "pre_approve_verdict": "revise_consolidator"
}
```

Then run `python3 .cursor/hooks/product-review-chain-next.py`.

## Self-chain

When `chain_enabled` is true and consolidator just finished, **continue as pre-approve reviewer in the same turn** — do not ask human until verdict is `awaiting_human` or `blocked`.

## One-line start

```
Pre-approve review for queue onboarding-round1 per .cursor/skills/pre-approve-review/SKILL.md.
Read consolidator outputs + source persona reviews. Write *-pre-approve-review.md. Update session phase review_done.
```

## Handoff

Human reads `*-pre-approve-review.md` → `./.cursor/hooks/product-review-loop-approve.sh` if verdict approve_ready / approve_with_notes.
