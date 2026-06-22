# Validation handoff — 2026-06-22 · sport-meetup

**Queue:** `sport-meetup-launch`  
**Builder branch:** `fix/sport-meetup-builder`  
**Synthesis:** [2026-06-22-sport-meetup-synthesis.md](./2026-06-22-sport-meetup-synthesis.md)

## Start command

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue sport-meetup-launch --from module-sport-meetup-sports --builder
```

---

## Contract order

| Order | Contract |
|-------|----------|
| 1 | `module-sport-meetup-sports` |
| 2 | `module-sport-game-modes` |
| 3 | `flow-create-game` |
| 4 | `module-sport-icon` |

---

## When green

```bash
./.cursor/hooks/product-review-loop-validation-green.sh
```
