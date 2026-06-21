# Product review outputs

Persona UX reviews (sport × commitment) live here before they become contract changes.

**Master map:** [agent-development-layers.md](../agent-development-layers.md)  
**Personas (12 pickup + 8 role):** [personas.md](./personas.md)  
**Onboarding contracts:** [ONBOARDING-CONTRACT-INDEX.md](../contracts/ONBOARDING-CONTRACT-INDEX.md)  
**Skills:** `.cursor/skills/product-review/` · `.cursor/skills/product-review-consolidator/`

## Folder layout

```
docs/product-review/
  personas.md
  {persona-id}/YYYY-MM-DD-review.md
  {persona-id}/YYYY-MM-DD/*.png
  consolidated/YYYY-MM-DD-synthesis.md
```

## Layer 1 flow

1. Run **one persona per Agent session** (see `personas.md`)
2. After ≥3 reviews → **consolidator** Agent → `consolidated/*-synthesis.md`
3. Human approves → **write-contract** → Layer 2 PR
4. **validation-loop-start.sh** → Layer 3

Not the same as contract validation screenshots (`docs/contracts/screenshots/`).
