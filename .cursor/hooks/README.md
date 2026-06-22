# Cursor hooks (Rally)

Hooks run after agent events. See Cursor **Settings → Hooks** and the Hooks output channel when debugging.

## Automated contract chain (Validator → Fixer → Validator)

**Primary: agent self-chain** (not the Cursor hook). After every session write, agent runs `python3 .cursor/hooks/validation-chain-next.py` and continues Fixer/Validator in the **same turn**. Hook is backup only. See `docs/contracts/.validation-next.md`.

### Setup (once)

```bash
chmod +x .cursor/hooks/contract-validation-chain.py
chmod +x .cursor/hooks/validation-loop-start.sh
chmod +x .cursor/hooks/validation-loop-stop.sh
```

Restart Cursor after `hooks.json` changes. Confirm under **Settings → Hooks**.

### Start a chain (one Agent chat)

**Baseline queue (recommended after Loop A green):**

```
Run ./.cursor/hooks/validation-loop-start.sh --queue baseline --from flow-rally-session and complete the Validator phase in this same turn.
```

**Single contract:**

```
Run ./.cursor/hooks/validation-loop-start.sh flow-rally-session and complete the Validator phase in this same turn.
```

Queues: `baseline` · `phase1a` · `phase1b` · `phase1c` — see `docs/contracts/validation-queues.json`

| Result | Same chat |
|--------|-----------|
| **pass** | `VALIDATION_GREEN` — done, no Fixer |
| **fail** | Auto **Fixer** follow-up → then **Validator** again |
| **needs_builder** | Pauses (or **Builder** if you used `--builder`) |

Next contract when green (same chat):

```
Run ./.cursor/hooks/validation-loop-start.sh flow-inbox and complete the Validator phase in this same turn.
```

### Start from terminal only (optional)

```bash
./.cursor/hooks/validation-loop-start.sh flow-rally-session --paste
```

Copy the printed prompt into Agent — use only if you are not asking Agent to run the script.

Quiet (session file only — Agent already knows what to do):

```bash
./.cursor/hooks/validation-loop-start.sh flow-rally-session --quiet
```

### Exit conditions

| Condition | Result |
|-----------|--------|
| Validator **pass** | Chain stops (`VALIDATION_GREEN`) |
| Validator **fail** | Auto **Fixer** → **Validator** (max 3 rounds) |
| **needs_builder** (no `--builder`) | Pauses for you |
| **needs_human** | **Pauses** — undecided product gate in contract; update contract, restart chain |
| **partial (sim prep)** | **Continues** — agent signs out / fresh signup / re-seed / SQL (no human pause) |
| **partial (product gate)** | **Pauses** — legal/H gate / not built; human decides |
| **blocked_external** | **Pauses** — Supabase/seed/device down; Fixer won't help |
| `./validation-loop-stop.sh` | You stop it |

### One loop, many contracts

Same hook + same Agent chat pattern — only the contract id changes:

```bash
./.cursor/hooks/validation-loop-start.sh flow-invite-to-rally   # green
./.cursor/hooks/validation-loop-start.sh flow-rally-session     # next item
```

Only one active chain (`chain_enabled: true`) at a time.

Poll / missing UI:

```bash
# Agent message:
Run ./.cursor/hooks/validation-loop-start.sh flow-availability-poll --builder and complete Validator this turn.
```

### State file

| File | Purpose |
|------|---------|
| `docs/contracts/.validation-session.json` | Active chain (gitignored) |
| `docs/contracts/.validation-session.example.json` | Shape reference |

Agents **must** write `.validation-session.json` at the end of each phase (prompts include this). The hook reads `phase` + `status` to choose the next role.

### Manual mode (three separate chats)

Still valid — see [VALIDATION-RUNBOOK.md](../../docs/contracts/VALIDATION-RUNBOOK.md).

## Product review loop (Layer 1 → Builder → Validator)

**Not** the validation hook — tracks persona queue progress separately.

```bash
chmod +x .cursor/hooks/product-review-loop-start.sh
./.cursor/hooks/product-review-loop-start.sh --queue onboarding-round1
```

| Step | Command / action |
|------|------------------|
| Start queue | `product-review-loop-start.sh --queue onboarding-round1 --chain` |
| After each persona | Update `.product-review-session.json` → `product-review-chain-next.py` |
| Pre-approve | Auto in chain — may auto-pass to contract PR |
| Manual approve | `product-review-loop-approve.sh` (only if auto-pass blocked) |
| Contract merged | `product-review-loop-contract-merged.sh` |
| Builder local done | `product-review-loop-builder-done.sh` → **validate locally** (no src PR yet) |
| Validation green | `product-review-loop-validation-green.sh` → then open src PR |
| Src PR merged | `product-review-loop-src-pr-merged.sh` |
| Proof | `validation-loop-start.sh --queue cps-onboarding --builder` |
| Auto-pass check | `python3 .cursor/hooks/product_review_auto_pass.py` |

Runbook: [PRODUCT-REVIEW-LOOP.md](../../docs/product-review/PRODUCT-REVIEW-LOOP.md) · Queues: [review-queues.json](../../docs/product-review/review-queues.json)

**Auto-continue (recommended):** `hooks.json` uses `rally-loop-continue.py` on **stop** + **subagentStop** (`loop_limit: 40`). Enable in Cursor Settings → Hooks. Use one Agent chat for the validation queue.

**Loop completion signal (orchestrator chat):**

```bash
./.cursor/hooks/rally-loop-status.sh   # also writes docs/LOOP-STATUS.md
```

Headline is **PHASE COMPLETE**, **PAUSED**, **WAITING ON YOU**, or **IN PROGRESS**. Say **continue** when status is PAUSED/COMPLETE and you want the next step.

Tier 2/3 (`onboarding-round2-picky`, `round3-expert`) = pickier personas after round 1 green.

### Legacy

`contract-loop-followup.sh` — old Validator-only re-prompt via `RALLY_CONTRACT_LOOP=1` env. Prefer `validation-loop-start.sh` + state file.

## Hook API reference

| Event | Use for | Key output |
|-------|---------|------------|
| `stop` | Main agent finished | `followup_message` + `loop_limit` |
| `subagentStop` | Task/subagent finished | `followup_message` |

## Related

- [validate-contract.md](../workflows/validate-contract.md)
- [VALIDATION-RUNBOOK.md](../../docs/contracts/VALIDATION-RUNBOOK.md)
