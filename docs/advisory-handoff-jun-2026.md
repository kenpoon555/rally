# Advisory handoff — Rally agent development system

**Prepared:** 2026-06-15  
**Audience:** Advisory agent / external reviewer  
**Purpose:** Status since post-v1 + portable validation-loop guide  
**Active product plan:** [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) — merged from advisory review Jun 2026

**Start here for daily work:** [DOCS-INDEX.md](./DOCS-INDEX.md)

---

## 1. Executive summary

Rally moved from ad-hoc “run Loop A in a chat” to a **four-layer agent development system**:

| Layer | Question | Automation |
|-------|----------|------------|
| **1 — Product review** | Should we build it? | Manual persona sessions → consolidator |
| **2 — Author contract** | What must ship? | `write-contract` skill → docs PR |
| **3 — Proof** | Does it match contract? | **Validation chain** (Validator → Fixer → Validator) |
| **4 — Ship** | Safe to release? | Branch promote + EAS + human merge gates |

The centerpiece is **Layer 3**: one Agent chat can validate many contracts in sequence using a **state file + self-chain** pattern, with a Cursor `stop` hook as backup.

**Merged to `dev` this week (PRs #27–#29):**

| PR | What |
|----|------|
| [#27](https://github.com/kenpoon555/rally/pull/27) | Post-v1 retention contracts + validation queue index |
| [#28](https://github.com/kenpoon555/rally/pull/28) | Validation chain (hooks, scripts, runbook), DOCS-INDEX, product-review layer, agent-development-layers |
| [#29](https://github.com/kenpoon555/rally/pull/29) | Loop A fixer work (iOS deep links, invite redeem), testIDs, Monrovia seed fixes, phase1 contract screenshots, store listing assets |

**Validation progress (Layer 3):**

| Queue | Status |
|-------|--------|
| `baseline` (5 contracts) | ✅ Green |
| `phase1a` (attendance, host-nudges, analytics) | ✅ Green |
| `phase1b` (availability-poll) | ✅ Green |
| `phase1c` (rotation, mini-tournament, leaderboard) | 🔄 When test groups need it |
| `phase2-recap` | ✅ Done |
| `phase2-game-card` | ⬜ Optional pre-beta |
| **GTM 1** | Device launch gate | ⬜ Real iPhone + Android |
| **GTM 2** | 3–5 real groups | ⬜ After store approval |

**Product plan:** [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md)

**Branching:** `feature/* → dev → preview → main → production`  
Preview EAS builds are **manual** (workflow_dispatch). Production merge triggers EAS + store submit.

**Infra cost (~50 MAU):** ~$10–15/mo lean (domain + Apple amortized); Supabase free tier; manual preview builds to save EAS credits. See [develop-process-and-costs.md](./develop-process-and-costs.md).

---

## 2. What changed last week (detail for advisor)

### 2.1 Contracts & roadmap

- **15+ new/updated contracts** under `docs/contracts/` for post-v1 retention (poll, rotation, tourney, leaderboard, recap, attendance, nudges, analytics, game-card venue).
- **Gold template:** `flow-invite-to-rally.md` — every contract has demo setup, observable checklist, performance budgets (P*), cost estimates (C*), human gates (H*), screenshot filenames, Validator report template.
- **Index:** `post-v1-roadmap-contracts.md` + `validation-queue.md` define sprint order.
- **Queues JSON:** `validation-queues.json` — machine-readable sprint lists for `--queue` mode.

### 2.2 Validation automation (the loop)

Built end-to-end orchestration:

- **Start:** `validation-loop-start.sh` writes session state, prints Validator instructions.
- **State machine:** `validation-chain-lib.py` — `compute_next()` decides Fixer / Validator / Builder / stop.
- **Self-chain:** Agent runs `validation-chain-next.py` after every phase write and continues **same turn** (primary path).
- **Hook backup:** `contract-validation-chain.py` on Cursor `stop` event → `followup_message` if hook fires.
- **Recovery:** `validation-loop-continue.sh` when agent stops early (~1 human tap per contract today).
- **Queue mode:** After green on contract N, auto-advances to N+1 in same chat.

### 2.3 Product review layer (Layer 1)

- **12 personas** (sport × commitment): `docs/product-review/personas.md`
- **Skills:** `product-review`, `product-review-consolidator`, `write-contract`
- **Workflows:** `product-review.md`, `consolidate-product-reviews.md`, `author-contract.md`
- **Rule:** Run after baseline validation green — reviews should not fight validated v1 behavior.

### 2.4 Fixer outcomes from validation (PR #29)

| Area | Fix |
|------|-----|
| iOS deep links | `AppDelegate.swift` → `RCTLinkingManager` for URL + universal links |
| Game invite redeem | `processDeepLink.ts`, `activityService.ts` |
| Sim automation | `testID` / `accessibilityLabel` on session card, rally hub tabs, lock roster confirm |
| Demo seed | SQL column order; devin/riley for lock-at-8 scenarios |
| Chain recovery | `started` phase now transitions to `validator_pending` |

### 2.5 Store / release prep

- Contract screenshot evidence for phase1 flows in `docs/contracts/screenshots/`
- Store listing asset bundles + generation scripts
- `store-review-test-accounts.md`, Play Console checklist

### 2.6 Known limitations (honest)

| Issue | Mitigation |
|-------|------------|
| Agent stops between contracts despite self-chain rules | Human runs `validation-loop-continue.sh` |
| Cursor `stop` hook unreliable | Self-chain via `validation-chain-next.py` is primary |
| Sim tap flakes on lock/attendance | Sim-only Validator retry without extra Fixer round; testIDs |
| Long context in one chat | Fresh chat per queue sprint is OK |

---

## 3. Questions for advisory review

1. **Layer ordering** — Is “validate v1 baseline before Layer 1 product review” the right gate?
2. **Contract granularity** — Are flow vs module splits right? Is `module-game-card` too wide for one contract?
3. **Self-chain vs hook** — Worth investing in stronger hook reliability, or is manual `continue.sh` acceptable overhead?
4. **Persona coverage** — 12 personas × sim walkthrough: right breadth before consolidator?
5. **Cost discipline** — C* blocks in contracts: sufficient for solo-founder scale?
6. **phase2 split** — Recap before game-card PR: agree with sequencing?
7. **Autopilot ceiling** — What should remain human-only at 50–200 MAU?

---

## 4. The four layers (how everything fits)

```
Product review → Contract PR → Validate (queue) → Promote → EAS / stores
   Layer 1          Layer 2        Layer 3          Layer 4
```

Full map: [agent-development-layers.md](./agent-development-layers.md)

### Layer 1 — Product review

- **Not** pass/fail against a spec. Subjective UX from persona lens.
- One persona per Agent session → `docs/product-review/{persona-id}/*-review.md`
- Consolidator merges ≥3 reviews → proposed contract diffs
- **Human gate:** approve synthesis before Layer 2

### Layer 2 — Author contract

- Spec is source of truth for Builder/Validator/Fixer
- `write-contract` skill enforces structure (checklist, P*, C*, H*, screenshots)
- Docs-only PR to `dev`
- **Human gate:** PR review; resolve H* gates before Builder

### Layer 3 — Proof (validation chain)

- **Validator** never edits app code
- **Fixer** edits only failed checklist rows (max 3 rounds)
- **Builder** only when feature missing (`--builder` flag)
- Evidence: pass/fail table + screenshots in contract folder
- **Human gate:** pause on `needs_human`, `blocked_external`, `max_fixer_rounds`

### Layer 4 — Ship

- `promote-branch.md`: dev → preview → main → production
- Validation green on affected contracts before production
- **Human gate:** every PR merge + store review

---

## 5. Validation loop — deep dive (portable guide)

This section explains **how to replicate the system in another project**.

### 5.1 Core idea

Traditional agent workflow: human copies Validator prompt → pastes failures → copies Fixer prompt → repeat. **Fragile and slow.**

Rally pattern:

1. **Contracts** are the shared state (spec + checklist + report template).
2. **Session file** (`.validation-session.json`) is the orchestration state (phase, status, failed_rows, queue).
3. **State machine** (`compute_next`) decides the next role.
4. **Agent self-chain** runs the state machine after every phase — same chat, same turn.
5. **Hook** re-sends the next prompt if the agent stopped anyway.

```
Human: one line to start
         │
         ▼
┌─────────────────┐     write session      ┌──────────────────┐
│ validation-loop │ ─────────────────────► │ .validation-     │
│ -start.sh       │                        │ session.json     │
└─────────────────┘                        └────────┬─────────┘
                                                    │
         ┌──────────────────────────────────────────┘
         ▼
┌─────────────────┐   fail    ┌────────┐   done   ┌───────────┐
│   Validator     │ ────────► │ Fixer  │ ───────► │ Validator │
│ (no code edits) │ ◄──────── └────────┘          └─────┬─────┘
└─────────────────┘         re-validate                 │ pass
                                                        ▼
                                              next contract in queue
                                              or VALIDATION_GREEN stop
```

### 5.2 The three roles (+ optional Builder)

| Role | Edits code? | Input | Output |
|------|-------------|-------|--------|
| **Validator** | No | Contract checklist | Pass/fail table, screenshots, `failed_rows`, session write |
| **Fixer** | Yes — failed rows only | `failed_rows` from session | Minimal diff, session `fixer_done` |
| **Builder** | Yes — full gap | Contract + `--builder` | Feature implementation, session `builder_done` |

**Stop statuses** (session `status`):

| Status | Meaning |
|--------|---------|
| `pass` | All checklist rows green → advance queue or stop |
| `fail` | Specific rows failed → Fixer |
| `needs_builder` | Feature not built → pause or Builder if `--builder` |
| `needs_human` | Undecided H* gate in contract |
| `blocked_external` | Env down (no Supabase, no sim) — Fixer can't help |
| `max_fixer_rounds` | Same failure after 3 Fixer passes |

### 5.3 Session file schema

Gitignored runtime file; example committed at `docs/contracts/.validation-session.example.json`:

```json
{
  "contract_id": "flow-rally-session",
  "contract_path": "docs/contracts/flow-rally-session.md",
  "phase": "validator_done",
  "status": "fail",
  "failed_rows": ["3 | Member I'm in | Fail | Button does not update roster"],
  "fixer_round": 1,
  "max_fixer_rounds": 3,
  "chain_enabled": true,
  "auto_builder": false,
  "queue_name": "baseline",
  "queue": ["flow-invite-to-rally", "flow-rally-session", "..."],
  "queue_index": 1,
  "updated_at": "2026-06-07T12:00:00+00:00"
}
```

**Phase transitions:**

| phase | Set by | Next (via compute_next) |
|-------|--------|-------------------------|
| `started` | start script | → Validator |
| `validator_pending` | chain | → Validator runs |
| `validator_done` | Validator | pass → next contract / stop; fail → Fixer |
| `fixer_pending` | chain | → Fixer runs |
| `fixer_done` | Fixer | → Validator |
| `builder_pending` / `builder_done` | Builder path | → Validator |
| `done` / `blocked` | terminal | chain_enabled false |

### 5.4 File inventory (copy to new project)

```
.cursor/
  hooks.json                          # Cursor stop hook registration
  hooks/
    README.md                         # Human setup guide
    validation-loop-start.sh          # Creates session, prints Validator brief
    validation-loop-continue.sh         # Recovery: run chain-next
    validation-loop-stop.sh           # Disable chain_enabled
    validation-chain-lib.py           # State machine + role prompts + SELF_CHAIN text
    validation-chain-next.py          # CLI: compute next, write .validation-next.md
    contract-validation-chain.py      # Cursor stop hook wrapper
  rules/
    rally-workflows.mdc               # alwaysApply: self-chain + start one-liners
  skills/
    write-contract/SKILL.md           # Layer 2 contract authoring
    product-review/SKILL.md           # Layer 1 (optional)
    product-review-consolidator/SKILL.md
  workflows/
    validate-contract.md              # Role definitions + hook rules
    author-contract.md
    product-review.md
    consolidate-product-reviews.md
    promote-branch.md

docs/
  DOCS-INDEX.md                       # Agent/human entry point
  agent-development-layers.md         # Layer map
  contracts/
    *.md                              # One spec per flow/module
    validation-queues.json            # Sprint queues for --queue
    validation-queue.md               # Human sprint order
    VALIDATION-RUNBOOK.md             # One-liner per contract
    .validation-session.example.json
    screenshots/{contract-id}/          # Proof artifacts
    .validation-session.json          # GITIGNORE — runtime only
    .validation-next.md               # GITIGNORE — last computed next action
```

### 5.5 Cursor hook wiring

`.cursor/hooks.json`:

```json
{
  "version": 1,
  "hooks": {
    "stop": [
      {
        "command": ".cursor/hooks/contract-validation-chain.py",
        "loop_limit": 40
      }
    ]
  }
}
```

On agent turn end, hook reads session. If `chain_enabled` and next action is fixer/validator, emits:

```json
{"followup_message": "<full next role prompt>"}
```

**Important:** Self-chain in the agent prompt is primary because the hook often does not fire reliably. The hook is insurance.

### 5.6 Self-chain rule (embed in every role prompt)

From `validation-chain-lib.py` — appended to Validator, Fixer, Builder prompts:

```
After you write `.validation-session.json`:
1. Run: python3 .cursor/hooks/validation-chain-next.py
2. Read docs/contracts/.validation-next.md
3. If next role is fixer/validator/builder → continue as that role in THIS SAME TURN
4. Only stop when next action is `stop` (green, paused, max rounds)
5. After pass in a queue → immediately Validator for next contract (re-seed first)

Never ask the human to invoke Fixer or re-run Validator when chain_enabled is true.
```

Also in `.cursor/rules/*.mdc` with `alwaysApply: true` so every agent turn sees it.

### 5.7 Queue mode

`validation-queues.json` defines named sprints:

```json
{
  "baseline": {
    "description": "Lock what v1 shipped",
    "contracts": ["flow-invite-to-rally", "flow-rally-session", "..."]
  }
}
```

Start mid-queue:

```bash
./.cursor/hooks/validation-loop-start.sh --queue baseline --from flow-rally-session
```

On `VALIDATION_GREEN` for one contract, `advance_queue()` bumps `queue_index`, resets `fixer_round`, sets next `contract_id`, and self-chain starts Validator for the next item.

### 5.8 Contract structure (minimum viable)

Every contract needs:

1. **contract id** (matches filename without `.md`)
2. **Demo setup** — exact seed commands, test accounts, deep links
3. **Pass/fail checklist** — every row observable on sim (action + expected UI)
4. **Screenshots required** — folder + filenames Validator must capture
5. **Validator report** — empty template Validator fills each run
6. Optional but recommended: P* performance, C* cost, H* human gates, out of scope

Template: `docs/contracts/flow-invite-to-rally.md`  
Authoring skill: `.cursor/skills/write-contract/SKILL.md`

### 5.9 Human commands (reference)

```bash
# Single contract
./.cursor/hooks/validation-loop-start.sh flow-post-game-recap --builder

# Queue sprint
./.cursor/hooks/validation-loop-start.sh --queue phase2-recap --builder

# Recovery when agent stopped early
./.cursor/hooks/validation-loop-continue.sh

# Stop chain
./.cursor/hooks/validation-loop-stop.sh

# Agent one-liner (paste in chat)
Run ./.cursor/hooks/validation-loop-start.sh --queue phase2-recap --builder and self-chain until stop. Re-seed via supabase CLI yourself.
```

### 5.10 Setup checklist for a new project

1. **Create `docs/contracts/`** with one gold-template contract.
2. **Copy hooks** from Rally (lib + start + continue + next + chain hook).
3. **Add `.cursor/hooks.json`** stop hook; `chmod +x` scripts; restart Cursor.
4. **Gitignore** `.validation-session.json` and `.validation-next.md`.
5. **Write `validate-contract.md`** workflow with role rules and SELF-CHAIN section.
6. **Add `alwaysApply` rule** pointing agents to self-chain + seed themselves.
7. **Define test accounts + seed script** — Validator must never ask human to seed.
8. **Add `validation-queues.json`** when you have >3 contracts to validate in a sprint.
9. **Add `DOCS-INDEX.md`** — agents search by task keyword.
10. **Pin one Agent chat per queue sprint** — reduces context rot.

Adapt paths in `validation-chain-lib.py` prompts (`WORKFLOW`, seed commands, screenshot dirs) to your stack.

### 5.11 What is NOT automatic

| Component | Runs alone? |
|-----------|-------------|
| Cursor `stop` hook | Sometimes — backup only |
| Workflows (`.cursor/workflows/*.md`) | No — agent reads when asked |
| Skills | No — loaded when task matches |
| Product review | No — separate Layer 1 sessions |
| Self-chain | Only if agent follows prompt + rule |

Cursor does **not** execute workflows like CI. They are instructions the agent loads.

### 5.12 Sim automation hardening (lessons learned)

- Add `testID` / `accessibilityLabel` on every button Validator must tap.
- `is_sim_automation_only()` in lib detects Metro/modal/tap flakes → one free Validator retry without burning Fixer round.
- Validator re-seeds DB **every run** — prior validation may have locked games or changed roster state.
- `failed_rows` must be **strings**, never bare `[2, 4]` — Fixer prompt needs human-readable context.

---

## 6. Recommended next steps (founder)

1. Finish **phase1c** validation if not complete.
2. Run **phase2-recap** only:
   ```bash
   ./.cursor/hooks/validation-loop-start.sh --queue phase2-recap --builder
   ```
3. PR **module-game-card** feature work → validate `phase2-game-card` separately.
4. **Layer 1:** 6 persona reviews → consolidator → contract PRs for v1.1 polish.
5. **Promote** `dev → preview` when ready for tester build.

---

## 7. Related docs

| Doc | Purpose |
|-----|---------|
| [advisory-handoff-contracts-jun-2026.md](./advisory-handoff-contracts-jun-2026.md) | **Full contract catalog** for advisor review |
| [DOCS-INDEX.md](./DOCS-INDEX.md) | Master index |
| [agent-development-layers.md](./agent-development-layers.md) | Layer map |
| [develop-process-and-costs.md](./develop-process-and-costs.md) | Branching, costs, progress |
| [contracts/VALIDATION-RUNBOOK.md](./contracts/VALIDATION-RUNBOOK.md) | Per-contract one-liners |
| [.cursor/hooks/README.md](../.cursor/hooks/README.md) | Hook setup |
| [advisoragent.md](../advisoragent.md) | Original strategy doc |

---

## 8. Prompt for advisory agent

```
You are an advisory reviewer for Rally's agent development system.

Read RallyApp/docs/advisory-handoff-jun-2026.md in full, then:
1. agent-development-layers.md
2. .cursor/hooks/README.md
3. docs/contracts/flow-invite-to-rally.md (contract quality sample)

Review:
- Layer ordering and human gates
- Validation chain design (self-chain + hook backup)
- Contract template completeness
- Sprint queue ordering (baseline → phase1 → phase2)
- Risks at 50–200 MAU solo-founder scale
- What to simplify vs double down on for other projects

Output: prioritized recommendations (P0/P1/P2), not a rewrite of the system.
```
