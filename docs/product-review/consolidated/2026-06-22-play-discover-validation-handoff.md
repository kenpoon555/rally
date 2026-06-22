# Validation handoff — play-discover · 2026-06-22

**Source:** [2026-06-22-play-discover-synthesis.md](./2026-06-22-play-discover-synthesis.md)  
**Queue:** `role-surface-audit`

## Ordered contracts (Layer 3)

| Order | Contract id | Why now |
|-------|-------------|---------|
| 1 | `module-role-surfaces` | Prove B3/B4 — sport matrix + R0 Classes gate |
| 2 | `flow-play-screen` | Matrix rows + empty copy + Players recency |
| 3 | `module-coach-parent-navigation` | Marcus Classes segment + Profile gates |
| 4 | `flow-profile` | R0 no coach blocks regression |

## Start command

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue role-surface-audit --from module-role-surfaces --builder
```

## Accounts

| Role | Account |
|------|---------|
| R0 proof | Fresh 18+ signup (no coach seed) |
| Coach/parent | `marcus@rally-mvrhoops.demo` |
| Cross-sport | `@kunyu` if password available |

## Screenshots required (new)

- `module-role-surfaces/01-running-players-empty.png`
- `module-role-surfaces/02-r0-no-classes-segment.png`
- `module-role-surfaces/03-coach-classes-segment.png`

## Deferred (post-green)

- B5 first-timer invite CTA — validate after Builder
- B9 Next Up navigation — separate `flow-rally-session` pass
