# Pre-approve review — theme-explore-round1 · 2026-06-26

**Tag:** `theme-explore` · **Verdict:** `approve_with_notes`
**Inputs:** [synthesis](2026-06-26-theme-explore-synthesis.md) · [builder-backlog](2026-06-26-theme-explore-builder-backlog.md) · [validation-handoff](2026-06-26-theme-explore-validation-handoff.md) · [persona review](../theme-reviewer/2026-06-26-review.md)

## Coverage — persona P0/P1 → synthesis/backlog
| Persona finding | Sev | In synthesis? | In backlog? |
|-----------------|-----|---------------|-------------|
| T1 lime CTA vs lime "You're in" pill collision | P0 | ✅ theme 1 | ✅ TM1 |
| T2 lime fills need dark `onPrimary` | P1 | ✅ theme 2 | ✅ TM2 |
| T3 dark mode = separate workstream | P1 | ✅ theme 4 / scope | ✅ noted (C dropped) |
| T5 urgency-hook contrast | info→P1 | ✅ theme 2 | ✅ TM3 |
| B = ship-candidate | dir | ✅ verdict | ✅ H1 + deferred TS1 |

All P0/P1 reflected. No dropped findings.

## Contract PR risk
| Item | Risk | Note |
|------|------|------|
| TM1 one-filled-primary rule (`module-visual-design-system`) | Low | Additive rule; matches existing `onPrimary` discipline. May flag the new `JoinStatusBanner`/`GameListCard` "You're in" chip — confirm it's a tint, not solid (it is, per Tier-6 build). |
| TM2 theming gate reaffirm | Low | Already-present gate, added one checklist row. |
| TM3 urgency-hook contrast (`module-game-card`) | Low | Additive checklist; no structural change. |
| Src changes | Low | **None this queue** — contract-only round, gated on H1. |
| Scope | Low | Palette-only; dark mode explicitly parked, no creep. |
| Legal / GTM | legal OK | No copy/claims/consent surface touched. |
| Timing | Low | Doesn't block Tier-6 src PR #90; independent. |

## Concerns for human
1. **H1 is a real decision** — pick a direction (B recommended) or request a fresh pitch to replace C. Nothing ships until then.
2. Renders are **mockups** (Metro/standalone-build blocked live capture). The contract rules stand on their own; the *visual* pick should be confirmed against a real `theme.ts` swap + validator gate before commit.
3. TM1 cross-check: verify the Tier-6 "You're in" chip already uses a tint (it does) so the new rule doesn't retroactively fail shipped src.

## Round 1b addendum (2026-06-26 · founder added candidates)
Founder requested **3 more candidates** + **a logo per theme**. Matrix now carries **6 directions** (A–F) and a per-theme logo. This does **not** change the contract diffs: TM1–TM3 are **palette-agnostic** and already cover D–F. No new findings; coverage table above still holds.

| Added | Risk | Note |
|-------|------|------|
| D Sunset Clay / E Electric Indigo / F Forest Turf renders | Low | Same layout, palette-only; rules apply unchanged. |
| Per-theme logos | Low | Branding exploration; **not** a contract surface this queue. A/B/C/E/F share the swoosh-R system; D's mark drifted (cosmetic, founder note only). |
| H1 decision space | Low | Now a 6-way pick instead of 3-way. Still the only gating human decision. |

## Verdict
`approve_with_notes` — contract diffs are additive, low-risk, and palette-agnostic across all 6 candidates. Proceed to contract PR; **H1 (founder palette pick, now 6-way)** remains the gating human decision for any src work.
