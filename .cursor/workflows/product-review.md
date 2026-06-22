# Workflow: Product review (persona UX)

**Layer 1.** Simulates user feedback; does **not** replace Validator.

Load skill: `.cursor/skills/product-review/SKILL.md`  
Personas: [personas.md](../../docs/product-review/personas.md) — **Catalog A:** 12 sport × commitment · **Catalog B:** 8 role/onboarding

## Loop (queued)

**Runbook:** [PRODUCT-REVIEW-LOOP.md](../../docs/product-review/PRODUCT-REVIEW-LOOP.md) · **Queues:** [review-queues.json](../../docs/product-review/review-queues.json)

```bash
./.cursor/hooks/product-review-loop-start.sh --queue onboarding-round1
```

```mermaid
flowchart LR
  Q[Start queue] --> P1[Persona 1]
  P1 --> Pn[Persona 6]
  Pn --> C[Consolidator]
  C --> BB[builder-backlog.md]
  C --> VH[validation-handoff.md]
  BB --> B[Builder]
  VH --> V[validation-loop-start.sh]
  V --> T2[Tier 2 picky queue]
```

## Step 1 — Persona review (one persona per Agent chat)

```
Product review: persona volleyball-host per docs/product-review/personas.md and .cursor/skills/product-review/SKILL.md.
iOS sim + Monrovia demo. Write docs/product-review/volleyball-host/YYYY-MM-DD-review.md + screenshots.
No code. No Validator.
```

Repeat for other persona-ids — **pickup batch** (6 sport personas) or **onboarding batch** (6 role personas) in `personas.md`.

## Step 2 — Consolidator (separate Agent chat)

After queue minimum reviews (6 for round1 queues):

```
Consolidate per .cursor/skills/product-review-consolidator/SKILL.md for queue onboarding-round1.
Write synthesis + builder-backlog + validation-handoff under docs/product-review/consolidated/
```

## Step 3 — Human → Builder → Validator

```bash
./.cursor/hooks/product-review-loop-approve.sh   # after you approve synthesis
./.cursor/hooks/validation-loop-start.sh --queue cps-onboarding --builder
```

## Not the same as

| | Product review | Consolidator | Validation |
|--|----------------|--------------|------------|
| Edits code | No | No (contracts only w/ approval) | Fixer yes |
| Hook chain | No | No | Yes |

## Master doc

[agent-development-layers.md](../../docs/agent-development-layers.md)
