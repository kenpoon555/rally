# Workflow: Consolidate product reviews

**Layer 1 → Layer 2.** Runs after multiple persona reviews.

Load skill: `.cursor/skills/product-review-consolidator/SKILL.md`  
Also load: `.cursor/skills/write-contract/SKILL.md` when drafting contract diffs

## When

- ≥ 3 files matching `docs/product-review/**/*-review.md`
- User wants top pain points or contract updates from feedback

## Start (separate Agent chat — not persona review chat)

```
Consolidate all docs/product-review/**/*-review.md per .cursor/skills/product-review-consolidator/SKILL.md.

Write docs/product-review/consolidated/YYYY-MM-DD-synthesis.md.
Propose contract updates with performance, H gates, and estimated monthly cost per write-contract skill.
Do not edit src/. Wait for my approval before contract PR.
```

## Output

| Artifact | Path |
|----------|------|
| Synthesis | `docs/product-review/consolidated/YYYY-MM-DD-synthesis.md` |
| Contract diffs | `docs/contracts/*.md` (proposed — human approves) |

## Human gate

Review synthesis → approve P0/P1 contract changes → docs PR to `dev` → Layer 3 validation

## Related

- [product-review.md](./product-review.md)
- [author-contract.md](./author-contract.md)
- [agent-development-layers.md](../docs/agent-development-layers.md)
