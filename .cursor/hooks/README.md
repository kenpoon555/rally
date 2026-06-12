# Cursor hooks (Rally)

Hooks run scripts or prompt checks **before/after** agent events. See Cursor **Settings → Hooks** and the Hooks output channel when debugging.

## Chaining work when an agent finishes

**Yes — this is supported.** Use the `stop` or `subagentStop` hook and return a `followup_message` so Cursor submits another prompt automatically.

| Event | Use for | Key output field |
|-------|---------|------------------|
| `stop` | Main agent finished a turn | `followup_message` + optional `loop_limit` |
| `subagentStop` | Task/subagent finished | `followup_message` |
| `postToolUse` | Inject context after a tool succeeds | `additional_context` |
| `subagentStart` | Gate whether a subagent may run | `permission` |

`loop_limit` caps how many times a `stop` / `subagentStop` hook may chain follow-ups (prevents infinite loops).

## Opt-in: contract validation loop

Copy the example config when you want Validator → Fixer style loops without typing `/loop` each time:

```bash
cp .cursor/hooks/hooks.json.example .cursor/hooks.json
chmod +x .cursor/hooks/contract-loop-followup.sh
```

Edit `contract-loop-followup.sh` to set `RALLY_CONTRACT` (e.g. `flow-rally-session`) and the follow-up prompt.

**Note:** Project hooks run from the repo root (`RallyApp/`). Restart Cursor or save `hooks.json` to reload.

## Related

- [validate-contract.md](../workflows/validate-contract.md) — Builder / Validator / Fixer prompts
- [create-hook skill](https://cursor.com/docs) — full hook API
