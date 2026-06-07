---
name: cli-first
description: Prefer official CLIs over MCP, browser, or manual user steps when a command-line tool exists. Use for git, gh, supabase, eas, npm, jest, gcloud, and Rally scripts — run commands yourself instead of telling the user to run them.
---

# CLI first

When a task can be done via **CLI**, run it in the terminal yourself. CLI is faster and more reliable than re-explaining steps to the user or using heavier indirection.

## Default behavior

1. **Check for a CLI** before MCP, dashboard clicks, or "please run this"
2. **Execute** via Shell tool (you have real shell access)
3. **Retry** with `--help` or alternate flags on failure — do not give up after one error
4. **Report** stdout/stderr briefly; paste URLs (PR links, deploy dashboard) when relevant

## Rally CLIs (common)

| Task | CLI |
|------|-----|
| Git / PR | `git`, `gh pr create`, `gh pr view`, `gh run watch` |
| Tests / lint | `npm run verify`, `npm test`, `npx jest path/to/test` |
| Supabase | `supabase db push`, `supabase functions deploy`, `supabase secrets list` |
| EAS | `npx eas-cli build`, `eas submit`, `eas env:list` |
| Play / GCP | `gcloud`, Play API scripts in `scripts/` |
| Expo credentials | `node scripts/eas-store-submit-credentials.mjs` |

Project ref (Supabase preview): `casljueycxsqexpkdiuq`

## When MCP is OK

- MCP is **better** when there is **no CLI** (e.g. some IDE integrations) or the MCP tool is the **only** supported API
- **Do not** use browser automation to replace `gh`, `supabase`, or `git`
- Pencil MCP for `.pen` files only — not for git/deploy

## Anti-patterns

- "Run this command:" without running it yourself (unless user must authenticate interactively)
- Reading large JSON dumps when `gh pr view --json title,state` suffices
- Skipping deploy because Docker warning appeared (Supabase deploy often works without local Docker)

## User must interact only when

- Login/oauth in browser (first-time `gh auth`, Expo login)
- Secret values you must not echo (`FIREBASE_SERVER_KEY`)
- Destructive ops user explicitly requested (force push, prod data delete)
