---
name: product-review
description: >-
  Persona-based UX review of Rally on iOS simulator — navigate, screenshot,
  and produce feedback for contract updates. Use when simulating a casual or
  hardcore badminton player, beta feedback, or product review before changing
  contracts. Not the Validator pass/fail loop.
---

# Product review (persona UX loop)

**Different from validation.** This loop asks *what should the product do?* — not *does it match the contract?*

| Loop | Question | Output |
|------|----------|--------|
| **Product review** (this skill) | Would this player want this? | Feedback doc → contract PR |
| **Validation** (`validate-contract.md`) | Does it match the contract? | Pass/fail → Fixer |

Do **not** wire product review to the validation hook. Human approves contract changes before Builder.

## Personas (pick one per session)

### Casual badminton player — "Sunday social"

- Plays 1–2x/month; invited by a friend
- Wants: tap link → see game → I'm in → done
- Low tolerance: account friction, jargon, nested tabs, dead ends
- Doesn't care: rotation algorithms, leaderboard history

**Journey focus:** invite → Today → I'm in → show up

### Hardcore organizer — "Weekly host"

- Runs a fixed crew; cares about full rosters and repeatability
- Wants: lock roster, nudge no-shows, next session visible, poll when short
- Low tolerance: duplicate taps, unclear host vs member, chat noise without actions
- Cares: session card, lock, attendance, polls

**Journey focus:** Rally hub Play → create/lock session → members → nudges

## Prerequisites

```bash
cd RallyApp
npm start
npm run ios
node scripts/seed-monrovia-basketball-rally-demo.mjs   # if needed
```

Login: `docs/store-review-test-accounts.md` (host `marcus@…`, member as needed)

Optional: mobile automation MCP for taps/screenshots if available.

## Procedure

1. **Read** persona above + relevant contracts (don't validate yet)
2. **Navigate** sim as that player — real taps, not only deep links
3. **Screenshot** each friction point:

   ```
   docs/product-review/{persona}/{YYYY-MM-DD}/{nn}-{screen}-{issue}.png
   ```

   Personas: `casual` · `hardcore`

4. **Write report** — `docs/product-review/{persona}/{YYYY-MM-DD}-review.md`:

   ```markdown
   # Product review — casual · 2026-06-15

   ## Persona goal
   Friend invited me to Sunday badminton — can I join in under 2 minutes?

   ## What worked
   - …

   ## Friction (prioritized)
   | P | Screen | Issue | Suggested change | Contract impact |
   |---|--------|-------|------------------|-----------------|
   | 1 | … | … | … | flow-invite-to-rally § … |

   ## Not in scope for this persona
   - …

   ## Recommended contract changes
   - [ ] Add checklist row to `flow-…`
   - [ ] New human gate H1 in …
   ```

5. **Stop** — do not edit app code in this session unless user explicitly asks

## Handoff to build loop

1. Human edits contract from "Recommended contract changes"
2. PR docs → merge `dev`
3. `./.cursor/hooks/validation-loop-start.sh {contract-id}` → validation chain

## Limitations (be honest in report)

- Agent is not a real human; call out sim-only artifacts
- Badminton-specific copy may be seeded as basketball in Monrovia demo — note sport mismatch
- Push, TestFlight install, real SMS — tier 2 / human only

## One-line start (single Agent chat)

```
Run product review as casual badminton player per .cursor/skills/product-review/SKILL.md.
Navigate iOS sim, save screenshots under docs/product-review/casual/, write review md.
Do not fix code or run Validator.
```

Hardcore variant: replace `casual` with `hardcore`.
