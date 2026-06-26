# Theme exploration plan

**Owner persona:** `theme-reviewer` ([personas.md catalog H](../product-review/personas.md))
**Validator gate:** [module-visual-design-system.md](../contracts/module-visual-design-system.md) (contrast, `onPrimary`/`onAccent`)
**Goal:** Feel 2–3 coherent directions side-by-side on the **Join-Loop screens** before committing any palette to code.

---

## Why

The app ships **one** palette today — `constants/theme.ts` "Neon" (lime `#B1E248` / yellow `#FCFD59` on light grey). It's distinctive but untested against alternatives. This loop produces a **themed-screenshot matrix** (baseline + each theme × each screen) so the founder can pick by feel and the validator can confirm accessibility — *without* a risky refactor first.

## Screens in scope (the Join Loop — same 5 as Tier 6)

| # | Screen | File |
|---|--------|------|
| 1 | Discover feed | Play tab · `components/game/GameListCard.tsx` |
| 2 | Game detail | `pages/Activity/ActivityDetailScreen.tsx` |
| 3 | Commit / RSVP state | `ActivityDetailScreen` (post-join) |
| 4 | Game room + roster | `components/GameRoomActionBar.tsx` |
| 5 | Post-game → next | `pages/Activity/PostGameAttendanceScreen.tsx` |

---

## The themes to pitch

Each theme is a **full token set** (drop-in replacement for `colors` in `theme.ts`). Spacing / radius / typography are **unchanged** — this is palette only, so it's a low-risk swap if chosen.

### Theme A — "Court Neon" (baseline / control)
Current palette. Included so every comparison has a control.

| token | value |
|-------|-------|
| primary / primaryDark | `#B1E248` / `#6B8F1E` |
| accent | `#FCFD59` |
| background / surface | `#EEEDEB` / `#FFFFFF` |
| text / textSecondary | `#141916` / `#5A635E` |
| onPrimary / onAccent | `#141916` / `#141916` |

### Theme B — "Clean Sport" (blue-on-white, ref-mockup direction)
Calm, trustworthy, "premium product" read — the direction the founder reacted well to. Single confident accent, lots of white, dark ink text.

| token | value |
|-------|-------|
| primary / primaryDark | `#2F6BFF` / `#1E4FCC` |
| accent | `#FF7A1A` (energy pop for "live/now") |
| background / surface | `#F7F8FA` / `#FFFFFF` |
| text / textSecondary | `#0E1726` / `#5B6472` |
| onPrimary / onAccent | `#FFFFFF` / `#0E1726` |

### Theme C — "Night Court" (dark, energetic)
High-contrast dark mode; lime stays as the energy accent but on near-black. Good for evening pickup vibe.

| token | value |
|-------|-------|
| primary / primaryDark | `#B1E248` / `#8FBE2E` |
| accent | `#FCFD59` |
| background / surface | `#0E120F` / `#1A201B` |
| text / textSecondary | `#F2F5F0` / `#A8B0A8` |
| onPrimary / onAccent | `#0E120F` / `#0E120F` |

> The theme-reviewer may swap one theme for a fresh pitch each round; A (baseline) always stays.

---

## How the loop runs

1. **Baseline capture** — `theme-reviewer` screenshots screens 1–5 on the iOS sim (`marcus@rally-mvrhoops.demo`, seeded loop state).
2. **Render matrix** — for each theme (B, C, …), produce **one image per screen** re-skinned to that palette. These are **generated mockups** for the fast founder look — *not* shipped UI.
3. **Founder pick** — founder reviews the matrix (baseline vs themes, per screen) and picks a direction or asks for a new pitch.
4. **Validator gate (before any code)** — validator checks the chosen palette against [module-visual-design-system.md](../contracts/module-visual-design-system.md): WCAG contrast on text, correct `onPrimary`/`onAccent` for fills, status colors still legible.
5. **Only then** — implement the chosen palette as a real token set in `theme.ts` (palette swap, no structural change) and re-run Tier 5 visual + a quick smoke on the 5 screens.

## Output of a theme round

- `docs/redesign/theme-rounds/YYYY-MM-DD-theme-matrix.md` — embeds baseline + themed renders per screen.
- One paragraph per theme: what it says about Rally, where it wins, where it risks (contrast, brand drift).
- A single recommendation: **ship / iterate / drop** per theme.

## Guardrails

- **Palette only.** No layout, spacing, type-scale, or component-structure changes in a theme round — those are Tier 5 / builder work.
- **Validator owns accessibility.** A theme the founder loves but that fails contrast does **not** ship until tokens are adjusted to pass.
- **Generated renders are mockups.** They exist to choose a direction fast; the real validation always happens on a built theme variant.
