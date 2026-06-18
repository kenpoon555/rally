---
name: product-review-consolidator
description: >-
  Consolidates multiple docs/product-review persona review.md files, finds
  recurring pain points by frequency and severity, and drafts contract updates.
  Use after Layer 1 persona reviews, before write-contract or contract PRs.
  Does not edit app code or run Validator.
---

# Product review consolidator

**Layer 1 → Layer 2 bridge.** Reads many persona reviews; outputs one synthesis + proposed contract diffs.

**Do not** run validation hook. **Do not** edit `src/` unless user explicitly asks to apply contract changes.

## When to run

- ≥ **3** persona `*-review.md` files exist for the same release window
- User asks to "consolidate reviews", "top pain points", or "update contracts from feedback"

## Inputs

```
docs/product-review/{persona-id}/*-review.md
docs/product-review/{persona-id}/**/*.png   (optional — cite in synthesis)
docs/contracts/*.md                         (targets for proposed diffs)
docs/post-v1-roadmap-contracts.md
```

Load persona definitions: `docs/product-review/personas.md`

## Procedure

1. **Collect** — glob all `docs/product-review/**/*-review.md`; list persona-id + date
2. **Extract** — from each file's "Friction" table: screen, issue, suggested change, contract impact
3. **Cluster** — group by theme (invite, auth, hub, lock, chat, performance, sport-specific)
4. **Score** each theme:

   | Factor | Weight |
   |--------|--------|
   | Personas mentioning it | High |
   | Priority P1/P2 in source reviews | High |
   | Blocks L1 first-timer | High |
   | Host-only (L4+) only | Medium |
   | Sport-specific copy/icon | Low unless ≥3 sports |

5. **Write synthesis** — `docs/product-review/consolidated/YYYY-MM-DD-synthesis.md`:

   ```markdown
   # Product review synthesis — YYYY-MM-DD

   ## Reviews included
   | persona-id | date | file |
   |------------|------|------|

   ## Top pain themes (ranked)
   | Rank | Theme | Personas (n) | Severity | Example quote / screen |
   |------|-------|--------------|----------|------------------------|

   ## Recommended contract changes
   | Priority | Contract file | Change type | Proposed diff summary |
   |----------|---------------|-------------|----------------------|
   | P0 | flow-invite-to-rally.md | new checklist row | … |
   | P1 | module-rally-hub.md | H gate | … |

   ## Out of scope (this cycle)
   - …

   ## Human decisions needed (H gates)
   | ID | Question | Options |
   |----|----------|---------|

   ## Suggested validation order after merge
   1. flow-…
   ```

6. **Draft contract updates** — for P0/P1 rows only:
   - Load `.cursor/skills/write-contract/SKILL.md`
   - Edit affected `docs/contracts/*.md` — add checklist rows, H gates, performance rows, **Estimated monthly cost**
   - Do **not** merge without human approval

7. **Stop** — present synthesis path + list of contract files touched; ask human to approve before PR

## Output rules

- Cite **persona count** ("4/6 reviewers hit invite spinner")
- Prefer **one contract row** over vague "improve UX"
- De-duplicate: same issue across sports → generic flow contract; sport copy → module or backlog
- If reviews conflict → add **H gate**, do not pick winner silently

## One-line start (separate Agent chat from persona reviews)

```
Consolidate all docs/product-review/**/*-review.md per .cursor/skills/product-review-consolidator/SKILL.md.
Write docs/product-review/consolidated/YYYY-MM-DD-synthesis.md and propose contract diffs (no src/ changes unless I approve).
Load write-contract skill for cost + H gates.
```

## Handoff

Human approves synthesis → contract PR (Layer 2) → `./.cursor/hooks/validation-loop-start.sh {contract-id}` (Layer 3)
