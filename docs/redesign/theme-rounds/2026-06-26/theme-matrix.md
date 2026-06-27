# Theme matrix — Join Loop · 2026-06-26 (round 1)

**Loop:** `theme-explore-round1` · **Persona:** `theme-reviewer`
**Plan:** [theme-exploration-plan.md](../../theme-exploration-plan.md) · **Validator gate:** [module-visual-design-system.md](../../../contracts/module-visual-design-system.md)

> **What these are:** generated mockups for a fast founder read on direction — *not* shipped UI. Layout/spacing/type are held constant; **palette only** changes between candidates. The live sim couldn't serve a JS bundle this round (standalone `com.rallyapp` build, no Metro), so the **baseline** is also a render rather than a live screenshot. Once a direction is picked, we swap real tokens in `theme.ts` and capture live.

## Candidate folders (same filenames in each → open side by side)

| Candidate | Folder | 01 Discover | 02 Game detail | 03 Post-game |
|-----------|--------|-------------|----------------|--------------|
| A — Court Neon (baseline) | `baseline-court-neon/` | `01-discover.png` | `02-game-detail.png` | `03-post-game.png` |
| B — Clean Sport | `theme-b-clean-sport/` | `01-discover.png` | `02-game-detail.png` | `03-post-game.png` |
| C — Night Court | `theme-c-night-court/` | `01-discover.png` | `02-game-detail.png` | `03-post-game.png` |
| D — Sunset Clay | `theme-d-sunset-clay/` | `01-discover.png` | `02-game-detail.png` | `03-post-game.png` |
| E — Electric Indigo | `theme-e-electric-indigo/` | `01-discover.png` | `02-game-detail.png` | `03-post-game.png` |
| F — Forest Turf | `theme-f-forest-turf/` | `01-discover.png` | `02-game-detail.png` | `03-post-game.png` |

### Token sets (D–F, round 1b)
| token | D · Sunset Clay | E · Electric Indigo | F · Forest Turf |
|-------|-----------------|---------------------|-----------------|
| primary / primaryDark | `#E2613B` / `#B8431F` | `#5B5BFF` / `#3D3DCC` | `#1F7A4D` / `#145C39` |
| accent (live/now) | `#F2B705` | `#18D2C4` | `#F4A300` |
| background / surface | `#FBF6F0` / `#FFFFFF` | `#F6F6FB` / `#FFFFFF` | `#F4F6F2` / `#FFFFFF` |
| text / textSecondary | `#2A2018` / `#6F635A` | `#14132B` / `#5C5B72` | `#15211B` / `#54625A` |
| onPrimary / onAccent | `#FFFFFF` / `#2A2018` | `#FFFFFF` / `#14132B` | `#FFFFFF` / `#15211B` |

---

## Logos (one mark, per-theme palette)

Same logo concept (squircle icon with an "R" motion swoosh + "Rally" wordmark), recolored per candidate.

| A · Court Neon | B · Clean Sport | C · Night Court |
|---|---|---|
| ![A logo](baseline-court-neon/logo.png) | ![B logo](theme-b-clean-sport/logo.png) | ![C logo](theme-c-night-court/logo.png) |

| D · Sunset Clay | E · Electric Indigo | F · Forest Turf |
|---|---|---|
| ![D logo](theme-d-sunset-clay/logo.png) | ![E logo](theme-e-electric-indigo/logo.png) | ![F logo](theme-f-forest-turf/logo.png) |

---

## Screen 1 — Discover feed

| A · Court Neon (baseline) | B · Clean Sport | C · Night Court |
|---|---|---|
| ![A discover](baseline-court-neon/01-discover.png) | ![B discover](theme-b-clean-sport/01-discover.png) | ![C discover](theme-c-night-court/01-discover.png) |

| D · Sunset Clay | E · Electric Indigo | F · Forest Turf |
|---|---|---|
| ![D discover](theme-d-sunset-clay/01-discover.png) | ![E discover](theme-e-electric-indigo/01-discover.png) | ![F discover](theme-f-forest-turf/01-discover.png) |

## Screen 2 — Game detail (join banner + grouped roster)

| A · Court Neon (baseline) | B · Clean Sport | C · Night Court |
|---|---|---|
| ![A detail](baseline-court-neon/02-game-detail.png) | ![B detail](theme-b-clean-sport/02-game-detail.png) | ![C detail](theme-c-night-court/02-game-detail.png) |

| D · Sunset Clay | E · Electric Indigo | F · Forest Turf |
|---|---|---|
| ![D detail](theme-d-sunset-clay/02-game-detail.png) | ![E detail](theme-e-electric-indigo/02-game-detail.png) | ![F detail](theme-f-forest-turf/02-game-detail.png) |

## Screen 3 — Post-game → next game

| A · Court Neon (baseline) | B · Clean Sport | C · Night Court |
|---|---|---|
| ![A postgame](baseline-court-neon/03-post-game.png) | ![B postgame](theme-b-clean-sport/03-post-game.png) | ![C postgame](theme-c-night-court/03-post-game.png) |

| D · Sunset Clay | E · Electric Indigo | F · Forest Turf |
|---|---|---|
| ![D postgame](theme-d-sunset-clay/03-post-game.png) | ![E postgame](theme-e-electric-indigo/03-post-game.png) | ![F postgame](theme-f-forest-turf/03-post-game.png) |

---

## Per-theme read

### A — Court Neon (baseline / control)
What it says: energetic, playful, "outdoor pickup". Distinctive and ownable. **Wins:** brand recognition, the lime CTA reads as "go". **Risks:** lime-on-white CTAs need dark text to pass contrast; the "You're in" lime pill competes with the lime CTA, so primary action can get lost on busy cards.

### B — Clean Sport (blue-on-white)
What it says: trustworthy, premium, "a real product". The single blue CTA + white space makes the **primary action unmistakable**, and reserving orange for "live/now" urgency gives a clean two-signal system (blue = action, orange = time pressure). **Wins:** strongest hierarchy of the three, white text on blue passes contrast easily, scales to coaching/classes without feeling loud. **Risks:** less differentiated (reads "default iOS-ish"); loses the lime brand equity.

### C — Night Court (dark)
What it says: evening run, hype, social. Lime pops hard on near-black and the urgency hook glows. **Wins:** high contrast, great for the 6–10pm pickup moment, photos/avatars look premium. **Risks:** dark mode only is a big commitment; needs a full dark token pass (status colors, dividers) and the lime "Confirm" vs lime "You're in" pill collision is worse here.

### D — Sunset Clay (warm terracotta on cream)
What it says: warm, human, "community court at golden hour". Terracotta + cream feels welcoming and premium without being corporate; golden urgency text is friendly rather than alarming. **Wins:** white-on-terracotta passes contrast easily, clear single-primary hierarchy, distinctive vs the sea of blue apps. **Risks:** warm palettes can read "lifestyle/food" more than "sport/competitive"; golden urgency is slightly lower urgency-signal than orange/red.

### E — Electric Indigo (indigo + cyan)
What it says: modern, energetic, "tech-forward sports product". Indigo primary with a cyan live/now accent gives the same clean two-signal system as B but with more personality. **Wins:** strong hierarchy, white-on-indigo passes contrast, the cyan accent feels fresh and "live". **Risks:** indigo/violet can skew gaming/crypto; cyan needs care to stay legible as small text on white.

### F — Forest Turf (deep green + amber)
What it says: outdoor, athletic, "field/turf". Deep grass green reads naturally sporty; amber urgency pops warmly against it. **Wins:** on-brand for outdoor pickup, white-on-green passes contrast comfortably, calm and trustworthy. **Risks:** green primary + green-tinted "You're in" tint can feel monochrome; must keep the join CTA clearly dominant over the status chip.

---

## Recommendation

| Theme | Verdict | Why |
|-------|---------|-----|
| B — Clean Sport | **Ship-candidate (iterate)** | Best action hierarchy + accessibility; closest to the reference the founder liked. |
| E — Electric Indigo | **Strong alt** | B's clarity with more personality; cyan "live" accent feels fresh. |
| D — Sunset Clay | **Distinctive option** | Warmest, most ownable; verify it reads "sport" enough. |
| F — Forest Turf | **On-brand outdoor option** | Natural athletic read; watch green-on-green chip vs CTA. |
| A — Court Neon | **Keep as brand option** | Strong identity; fix the lime-CTA-vs-lime-chip collision before it can win. |
| C — Night Court | **Drop for now / revisit as dark mode** | Great vibe but a separate dark-mode workstream, not a palette swap. |

**Founder action:** pick a direction from the 6. On pick → validator runs the [module-visual-design-system](../../../contracts/module-visual-design-system.md) contrast gate **before** any `theme.ts` change. (Round 1 = A–C, round 1b = D–F per your "3 more" request.)

## Notes / guardrails honored
- Palette-only; layout, spacing, type-scale identical across candidates.
- Renders are mockups; real validation happens on a built theme variant.
- Live baseline capture deferred — Metro/standalone-build blocker (same as Tier 6 validation).
