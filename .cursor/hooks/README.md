# Cursor hooks (Rally)

Hooks run after agent events. See Cursor **Settings → Hooks** and the Hooks output channel when debugging.

## Automated contract chain (Validator → Fixer → Validator)

**One chat.** You paste the Validator prompt once; the `stop` hook submits Fixer / re-Validator follow-ups in the **same** conversation.

### Setup (once)

1. Ensure `.cursor/hooks.json` exists (copy from `hooks.json.example` if needed).
2. Make scripts executable:

```bash
chmod +x .cursor/hooks/contract-validation-chain.py
chmod +x .cursor/hooks/validation-loop-start.sh
chmod +x .cursor/hooks/validation-loop-stop.sh
```

3. Restart Cursor after changing `hooks.json`.

### Start a chain

From `RallyApp/`:

```bash
./.cursor/hooks/validation-loop-start.sh flow-rally-session
```

The script:

- Writes `docs/contracts/.validation-session.json` (`chain_enabled: true`)
- Prints **one Validator prompt** → copy into **one** Cursor Agent chat

Optional — auto-chain **Builder** when Validator reports `needs_builder`:

```bash
./.cursor/hooks/validation-loop-start.sh flow-availability-poll --builder
```

### What happens next (no copy-paste)

| Agent finishes | Hook auto-submits |
|----------------|-------------------|
| Validator → **pass** | `VALIDATION_GREEN` message; chain stops |
| Validator → **fail** | **Fixer** prompt (same chat) |
| Fixer → done | **Validator** again |
| Validator → **needs_builder** | Pauses (or **Builder** if `--builder`) |
| 3 Fixer rounds exhausted | Stop + message to log blockers |

Stop anytime:

```bash
./.cursor/hooks/validation-loop-stop.sh
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
