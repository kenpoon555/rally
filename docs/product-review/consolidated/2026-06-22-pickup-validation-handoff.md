# Validation handoff — 2026-06-22 · pickup

**Queue:** `gtm2-feedback-jun-2026`  
**Builder branch:** `fix/pickup-builder`  
**Synthesis:** [2026-06-22-pickup-synthesis.md](./2026-06-22-pickup-synthesis.md)

## Start command

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue gtm2-feedback-jun-2026 --from flow-invite-to-rally --builder
```

**Flags:** CPS flags **off** (GTM 1 pickup focus)

---

## Contract order

| Order | Contract | Trigger |
|-------|----------|---------|
| 1 | `flow-invite-to-rally` | B1 deep links |
| 2 | `flow-create-game` | B2 schedule spinner |
| 3 | `flow-play-screen` | Discover regression |
| 4 | `flow-rally-session` | Host / crew paths |
| 5 | `flow-push-notifications-device` | Device-only — document if not run |
| 6 | `module-coach-parent-navigation` | Flags-off guard |

---

## Persona spot-checks

| Persona | Re-prove |
|---------|----------|
| `basketball-first-timer` | `invite/` link → detail |
| `badminton-host` | Create → publish → share |
| `multi-sport-power-host` | `group-invite` while logged in |

---

## When green

```bash
./.cursor/hooks/product-review-loop-validation-green.sh
```
