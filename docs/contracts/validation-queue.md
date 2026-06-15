# Validation queue — post-v1

**Human runbook (start here):** [VALIDATION-RUNBOOK.md](./VALIDATION-RUNBOOK.md) — Item 1 prompts filled in, fix vs build decision tree, progress checklist.

**Index:** [post-v1-roadmap-contracts.md](../post-v1-roadmap-contracts.md)  
**Workflow:** [.cursor/workflows/validate-contract.md](../../.cursor/workflows/validate-contract.md)

Run **Validator first** on every contract before any Builder work. Shared state = the contract file + pass/fail table pasted in PR or contract **Open issues**.

## Implementation order (suggested)

| Sprint | Contract(s) | Why this order |
|--------|-------------|----------------|
| **0 — Baseline** | Loop A, Loop B, `module-rally-hub`, `flow-inbox`, `flow-play-screen` | Lock what v1 shipped |
| **1a** | `flow-post-game-attendance`, `flow-host-nudges`, `module-analytics-events` | Shipped but unvalidated |
| **1b** | `flow-availability-poll` | Backend exists; highest retention ROI |
| **1c** | `flow-rotation-pairing`, `flow-mini-tournament`, `module-rally-leaderboard` | Group stickiness |
| **2** | `flow-post-game-recap`, `module-game-card` venue block | After attendance path green |
| **Ops** | `flow-crew-dormancy-nudge` | Build only after baseline green |

One contract per Builder PR. Do not batch unrelated features.

## One validation loop — many contracts (`--queue`)

Same Agent chat + same hook. After each **pass**, auto-advances to the next contract.

```bash
./.cursor/hooks/validation-loop-start.sh --queue baseline --from flow-rally-session
```

Queue definitions: [validation-queues.json](./validation-queues.json)

| Queue | Contracts |
|-------|-----------|
| `baseline` | invite → session → hub → inbox → play-screen |
| `phase1a` | attendance, host-nudges, analytics |
| `phase1b` | availability-poll |
| `phase1c` | rotation, tourney, leaderboard |
| `phase2` | post-game-recap, module-game-card (venue) |

On **fail**: Fixer → Validator for current contract only (max 3 rounds).  
On **pause** (`needs_human`, `blocked_external`, max rounds): resume with same `--queue --from {contract-id}`.

Agent one-liner:

```
Run ./.cursor/hooks/validation-loop-start.sh --queue baseline --from flow-rally-session and complete Validator this turn.
```

| Chat | Role | May edit code? |
|------|------|----------------|
| **1 — Validator** | Sim + screenshots + pass/fail table | **No** |
| **2 — Fixer** | Only failed rows from chat 1 | Yes, surgical |
| **3 — Builder** | New feature vs contract | Yes |

After Fixer → new **Validator** message (same chat or fresh). Max **3** Fixer rounds per contract.

## `/loop` — use for Validator only

Store recurring validation as a **Cursor prompt**, not a long autonomous agent run.

### Fixed interval (regression watch)

```
/loop 1h You are the Validator agent for Rally.

Read RallyApp/docs/contracts/flow-rally-session.md and RallyApp/.cursor/workflows/validate-contract.md.

Validate Loop B on iOS simulator. Do not change code.

Return pass/fail table only. If all rows pass, reply VALIDATION_GREEN and stop suggesting work.
If any row fails, list failed rows only for the Fixer.
```

Rotate contract each day: Loop A → Loop B → `flow-inbox` → `flow-availability-poll`.

### Dynamic (after each merge to dev)

```
/loop Validate the contract named in my last commit message per RallyApp/.cursor/workflows/validate-contract.md. Validator only. Pass/fail table. No code changes.
```

## Copy-paste — Validator (start every feature)

Replace `CONTRACT_PATH` and `CONTRACT_ID`.

```
You are the Validator agent for Rally contract validation.

Read:
- RallyApp/docs/contracts/CONTRACT_PATH
- RallyApp/.cursor/workflows/validate-contract.md
- RallyApp/docs/store-review-test-accounts.md (demo login)

Validate on iOS simulator against production-linked Supabase seed (Monrovia demo).

Steps:
1. npm start (Metro) + iOS sim booted
2. Seed if needed: node scripts/seed-monrovia-basketball-rally-demo.mjs
3. Execute contract demo setup and every checklist row
4. Save screenshots to docs/contracts/screenshots/CONTRACT_ID/ (filenames from contract)
5. Fill pass/fail table — every row Pass or Fail with notes

Do not fix code. Return:
- Full pass/fail markdown table
- List of failed rows only (for Fixer)
- Screenshot paths saved
```

## Copy-paste — Fixer

```
You are the Fixer agent for Rally contract validation.

Read:
- RallyApp/docs/contracts/CONTRACT_PATH
- RallyApp/.cursor/workflows/validate-contract.md

Fix ONLY these failed rows from the Validator report:

[PASTE FAILED ROWS]

Rules:
- Minimal diff; no new behavior beyond the contract
- Do not fix passing items
- Do not re-run validation — tell me to run Validator again

When done: summarize diff + which rows should now pass.
```

## Copy-paste — Builder (after Validator baseline OR new feature)

```
You are the Builder agent for Rally.

Read:
- RallyApp/docs/contracts/CONTRACT_PATH
- RallyApp/.cursor/workflows/validate-contract.md
- Related module contracts linked from CONTRACT_PATH

Implement until all checklist items should pass. Match existing code patterns.

Do not run validation. When done, list files changed and checklist rows addressed.
Then I will run Validator in a separate chat.
```

## Store loop state in repo

| Artifact | Where |
|----------|--------|
| Contract spec | `docs/contracts/*.md` |
| Pass/fail result | PR comment or contract **Open issues** |
| Screenshots | `docs/contracts/screenshots/{contract-id}/` |
| Last validated | Add row to contract: `Last validated: YYYY-MM-DD · build N` |

Optional: pin Validator prompts in Cursor **Rules** or a saved Composer tab per role (Validator / Fixer / Builder).

## Quick reference — first baseline run (this week)

1. Validator → `flow-rally-session.md` (Loop B)  
2. Fixer → failed rows  
3. Validator → again until green  
4. Repeat for `flow-availability-poll.md` before building poll UI  
