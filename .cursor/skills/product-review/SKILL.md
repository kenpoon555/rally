---
name: product-review
description: >-
  Persona-based UX review of Rally on iOS simulator — navigate, screenshot,
  and produce feedback for contract updates. Use with docs/product-review/personas.md
  (12 personas, 10+ sports × commitment levels). Not the Validator pass/fail loop.
  Run product-review-consolidator after multiple reviews.
---

# Product review (persona UX loop)

**Layer 1.** Asks *what should the product do?* — not *does it match the contract?*

| Loop | Question | Output |
|------|----------|--------|
| **Product review** (this skill) | Would this player want this? | `review.md` → consolidator |
| **Consolidator** | What pain is common? | synthesis → contract diffs |
| **Validation** | Does it match contract? | Pass/fail → Fixer |

Do **not** wire product review to the validation hook. Human approves consolidator + contract PR before Builder.

## Personas

**Full catalog:** [docs/product-review/personas.md](../../docs/product-review/personas.md) — **12 personas**, **10 sports**, **5 commitment levels**.

| persona-id | Sport | Level |
|------------|-------|-------|
| `basketball-first-timer` | Basketball | L1 |
| `badminton-casual` | Badminton | L2 |
| `badminton-host` | Badminton | L4 |
| `soccer-regular` | Soccer | L3 |
| `tennis-casual` | Tennis | L2 |
| `volleyball-host` | Volleyball | L4 |
| `pickleball-first-timer` | Pickleball | L1 |
| `running-regular` | Running | L3 |
| `golf-social-host` | Golf | L4 |
| `table-tennis-regular` | Table tennis | L3 |
| `softball-casual` | Softball | L2 |
| `multi-sport-power-host` | Multi | L5 |

Pick **one persona-id per Agent session.**

## Prerequisites

```bash
cd RallyApp
npm start
npm run ios
node scripts/seed-monrovia-basketball-rally-demo.mjs   # if needed
```

Login: `docs/store-review-test-accounts.md`

## Procedure

1. **Read** persona from `personas.md` + relevant contracts
2. **Navigate** sim as that player
3. **Screenshot** friction:

   ```
   docs/product-review/{persona-id}/{YYYY-MM-DD}/{nn}-{screen}-{issue}.png
   ```

4. **Write** `docs/product-review/{persona-id}/{YYYY-MM-DD}-review.md`:

   ```markdown
   # Product review — {persona-id} · YYYY-MM-DD

   ## Persona
   Sport: … · Commitment: L… · Goal: …

   ## What worked
   - …

   ## Friction (prioritized)
   | P | Screen | Issue | Suggested change | Contract impact |
   |---|--------|-------|------------------|-----------------|

   ## Sport-specific (if seed mismatch)
   - …

   ## Recommended contract changes
   - [ ] …
   ```

5. **Stop** — no app code unless user asks

## After ≥3 reviews

Run **consolidator** in a **separate** Agent chat:

```
Consolidate all docs/product-review/**/*-review.md per .cursor/skills/product-review-consolidator/SKILL.md.
```

## One-line start

```
Product review: persona badminton-casual per docs/product-review/personas.md and .cursor/skills/product-review/SKILL.md.
iOS sim. Screenshots + YYYY-MM-DD-review.md under docs/product-review/badminton-casual/. No code. No Validator.
```

## Limitations

- Agent simulates persona; not a real player
- Demo seed is basketball — note sport mismatch for non-basketball personas
- Push / TestFlight = tier 2 / human
