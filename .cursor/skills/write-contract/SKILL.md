---
name: write-contract
description: >-
  Author or update Rally screen/flow contracts in docs/contracts/. Use when
  defining a new feature spec, writing pass/fail checklists, adding performance
  budgets, external dependencies, or human decision gates before Builder work.
---

# Write Rally contract

Contracts are the **source of truth** for autopilot (Builder → Validator → Fixer). A vague contract produces confident wrong code.

**Read first:** `docs/contracts/flow-invite-to-rally.md` (gold template) · `docs/post-v1-roadmap-contracts.md` · `docs/launch-roadmap-jun-2026.md` (GTM gates — no Coach Pro/payments until GTM 3)

## When to use

- New feature before any Builder PR — **check [launch-roadmap-jun-2026.md](../../docs/launch-roadmap-jun-2026.md) GTM gate first**
- Product review proposes behavior changes → update contract first
- Validator keeps failing for ambiguous requirements → clarify contract, not code

## Contract types

| Type | File pattern | Example |
|------|--------------|---------|
| **Flow** | `flow-*.md` | End-to-end user journey |
| **Module** | `module-*.md` | Reusable UI/surface rules |

One flow per file. Link module contracts; do not duplicate module rules inside flows.

## Required sections (in order)

1. **Header** — `contract id`, loop/status, screens, related code paths
2. **Purpose** — one north-star sentence a tester can repeat
3. **Demo setup** — exact seed commands, accounts (`docs/store-review-test-accounts.md`), sim deep links
4. **Required states** — table: state · how to reach · must show
5. **Pass/fail checklist** — every row **observable** (sim step + expected UI)
6. **Performance requirements** — see below (required for flows; recommended for modules)
7. **Estimated monthly cost** — see below (required for any net-new infra or feature)
8. **External dependencies** — see below (required if any)
9. **Human decision gates** — see below (required if ambiguous product choice)
10. **Screenshots required** — folder + filenames
11. **Out of scope** — prevents Builder creep
12. **Open issues** — blockers table
13. **Validator report** — empty template; Validator replaces each run

Optional when green: `Last validated: YYYY-MM-DD · build N`

## Performance requirements (required for flows)

Add `## Performance requirements` with measurable rows Validator can check:

```markdown
## Performance requirements

| ID | Metric | Budget | How to measure |
|----|--------|--------|----------------|
| P1 | Cold open → interactive (auth or Today) | < 3s | Sim cold launch; log `Date.now()` or stopwatch in notes |
| P2 | Deep link → target screen | < 2s after JS handler | `openurl` → screen visible, no spinner > budget |
| P3 | Invite redeem / ActivityDetail | No spinner > 10s | Same as checklist stability row |
| P4 | List scroll (Play / Inbox) | No jank on 20 items | Manual scroll; note dropped frames only if obvious |
```

Rules:

- Budgets must be **sim-realistic** (not production SLA unless labeled tier 2)
- Tie performance IDs to checklist rows (`P3` ↔ "No permanent spinner")
- If not measurable on sim, mark **N/T** with reason — do not fake Pass

## Estimated monthly cost (required for changes)

Add `## Estimated monthly cost` for every contract change that adds or grows infra usage. Consolidator and human reviewers use this before approving Layer 2.

```markdown
## Estimated monthly cost

**Baseline (Rally app, ~50 MAU):** Supabase free tier $0 · or Pro $25/mo when branching/migrations need it · FCM push ~$0 · variable ops ~$0.01–0.05/MAU.

| ID | Cost driver | Δ @ 50 MAU | Δ @ 200 MAU | Notes |
|----|-------------|------------|-------------|-------|
| C1 | Supabase rows + RLS queries | +$0 | +$0–5 | New poll votes table |
| C2 | Edge function invocations | +$0 | +$1–3 | If adding cron nudge |
| C3 | Google Places / Maps | +$0–5 | +$10–25 | Only if feature calls Places |
| C4 | Storage (screenshots/recap) | +$0 | +$1 | If media upload |
| C5 | Cursor/agent validation | discretionary | — | More contracts = more Validator runs |

**Total estimated Δ:** +$0/mo @ 50 MAU · +$X/mo @ 200 MAU
**Pro tier required?** yes / no / when MAU > N
**Human gate if Δ > $25/mo @ 200 MAU:** yes — document in H* table
```

Rules:

- Use **incremental Δ**, not full stack repricing
- If change is UI-only (no new API/DB/cron) → `Δ @ 50 MAU: $0` with one-line justification
- Link expensive features to **H gate** ("approve C3 before Builder")
- Reference [agent-development-layers.md](../../docs/agent-development-layers.md) for infra baseline

## External dependencies (required if any)

Add `## External dependencies` when validation needs services outside the repo:

```markdown
## External dependencies

| ID | Service | Required for | If unavailable |
|----|---------|--------------|----------------|
| E1 | Linked Supabase preview | All rows | Validator → `blocked_external` |
| E2 | Monrovia demo seed | Rows 4–5 | Run seed script; else block |
| E3 | Physical device push | Push rows only | Mark N/T on sim |
| E4 | TestFlight build | Tier 2 install test | Human gate; not sim |
```

Validator must set session `status: "blocked_external"` and list dependency IDs in `failed_rows` when blocked — **chain stops** (no Fixer).

Fixer cannot fix external outages. Human resolves, then re-run `validation-loop-start.sh`.

## Human decision gates (required if ambiguous)

Add `## Human decision gates` when product choice blocks implementation:

```markdown
## Human decision gates

| ID | Decision | Options | Default if no answer |
|----|----------|---------|----------------------|
| H1 | Full game → still join Rally? | A: join Rally only · B: waitlist · C: block | **Ask human** — no Builder default |
| H2 | Paywall before create game? | yes / no / later | Deferred — out of scope |
```

When Validator hits an undecided gate (`H*` row cannot pass without a product call):

- Set `status: "needs_human"`
- Put gate ID + question in `failed_rows`
- **Chain stops** — hook asks you to decide, update contract, then restart chain

Do **not** let Fixer or Builder guess product policy.

## Checklist writing rules

- Each row: verb + observable outcome ("Lands on ActivityDetail", not "works well")
- Group: Stability · Auth · Core flow · Performance · Edge cases
- Avoid duplicate rows across flow + module — link instead
- Seed gaps → row notes say **N/T** + what's missing in seed

## Screenshot spec

```
docs/contracts/screenshots/{contract-id}/{nn}-{slug}.png
```

Filenames must match contract list. Validator overwrites on re-run.

## After writing

1. Add row to `docs/contracts/README.md` + `docs/post-v1-roadmap-contracts.md` if new
2. PR **docs only** to `dev` before Builder
3. Start validation: `./.cursor/hooks/validation-loop-start.sh {contract-id}`

## One validation loop, many contracts

The hook chain is **contract-agnostic**. Same chat, different contracts — run start script again after green:

```bash
./.cursor/hooks/validation-loop-start.sh flow-invite-to-rally   # Item 1
# … green …
./.cursor/hooks/validation-loop-start.sh flow-rally-session     # Item 2
```

Only one **active** chain at a time (`chain_enabled: true` in session file).

## Chain stop statuses (Validator writes these)

| `status` | Chain behavior |
|----------|----------------|
| `pass` | Stop — VALIDATION_GREEN |
| `fail` | Auto Fixer (failed rows only) |
| `needs_builder` | Pause (or Builder if `--builder`) |
| `needs_human` | **Stop — ask you** to update contract / decide |
| `blocked_external` | **Stop — ask you** to fix env/service |

Fixer/Builder must not run when status is `needs_human` or `blocked_external`.
