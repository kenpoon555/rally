# Cursor hooks (Rally)

Hooks run after agent events. See Cursor **Settings → Hooks** and the Hooks output channel when debugging.

## Automated contract chain (Validator → Fixer → Validator)

**One Agent chat.** You do not need a new chat per role. The `stop` hook submits Fixer / re-Validator **only when validation fails** — pass exits immediately.

### Why not fully automatic from terminal?

Cursor has **no API** for a shell script to open Agent or send the first message. Hooks only run **after** an Agent turn ends (`followup_message`). So something must kick off turn 1:

| Kickoff | How |
|---------|-----|
| **Recommended** | One permanent Agent chat: ask it to run the start script + Validator in the same turn |
| **Fallback** | `./validation-loop-start.sh <id> --paste` → copy long prompt |

### Setup (once)

```bash
chmod +x .cursor/hooks/contract-validation-chain.py
chmod +x .cursor/hooks/validation-loop-start.sh
chmod +x .cursor/hooks/validation-loop-stop.sh
```

Restart Cursor after `hooks.json` changes. Confirm under **Settings → Hooks**.

### Start a chain (one Agent chat — recommended)

Pin **one** Agent chat. Each new contract, send **one short message**:

```
Run ./.cursor/hooks/validation-loop-start.sh flow-rally-session and complete the Validator phase in this same turn.
```

The Agent runs the script (creates `.validation-session.json`), validates, writes the state file, and stops. The hook then:

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
