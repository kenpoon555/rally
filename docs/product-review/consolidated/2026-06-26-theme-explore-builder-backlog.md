# Builder backlog — theme-explore-round1 · 2026-06-26

Tag `theme-explore`. **No src/ changes in this queue** — this is a contract-only round; src work begins only after founder picks a direction (H1) and the validator contrast gate passes. Items below are **contract diffs** + the deferred src follow-up.

## Contract diffs (this queue)
| ID | Pri | Contract file | Checklist row to add |
|----|-----|---------------|----------------------|
| TM1 | P0 | `module-visual-design-system.md` | "One filled-primary action per surface; status/personal-state chips use a tint background, never a second solid primary fill." |
| TM2 | P1 | `module-visual-design-system.md` | "Every palette passes the theming gate: text ≥ WCAG AA, fills declare correct `onPrimary`/`onAccent`, status colors legible on surface." (reaffirm) |
| TM3 | P1 | `module-game-card.md` | "Urgency hook text meets min contrast on card surface in every shipped palette." |

## Deferred src follow-up (NOT this queue — gated on H1)
| ID | Pri | When | Item |
|----|-----|------|------|
| TS1 | P0 | after founder pick + validator gate | Implement chosen palette as a real token set in `theme.ts` (palette swap, no structural change). |
| TS2 | P1 | with TS1 | Re-run Tier 5 visual + smoke on the 5 Join-Loop screens; capture live screenshots to replace mockups. |

## Notes
- batch_pr / classic: contract-only — open contract PR for TM1–TM3; no builder src branch until H1.
