# Rally — App Icon & Brand Asset Brief

Last updated: 2026-06-01

## Brand context

**Rally** helps people find sports partners and keep a recurring crew. The icon must read as **coordination / crew**, not a single sport or a dating app.

**Palette (Court Fresh):**

| Token | Hex | Use |
|-------|-----|-----|
| Primary (court green) | `#0B7A5E` | Icon background or dominant shape |
| Primary dark | `#065F49` | Depth, sport icons in-app |
| Accent (coral) | `#E8622A` | Single accent dot — “ball” / urgency |
| Surface cream | `#F5F4F0` | Optional icon bg variant |
| White / cream | `#FFFFFF` | Mark strokes on green bg |

## App icon concept: **Rally mark**

- **Two nodes + arc** — two players connected by a subtle rally arc
- **One accent dot** — coral ball / meeting point
- **No text** in the icon (illegible at 29px)
- **No sport equipment** (no racket, hoop, or shuttle) — Rally is multi-sport
- **Flat vector** — no gradients, no drop shadows (iOS rounds corners automatically)

### Master file

- **1024×1024 PNG**, sRGB, no transparency required for iOS marketing icon
- Safe zone: keep mark inside center **80%** (Android adaptive icon masks edges)

### Repo location

```
RallyApp/assets/branding/icon-1024.png   ← master
RallyApp/scripts/generate-app-icons.sh     ← regenerates all sizes
```

Run after replacing the master:

```bash
cd RallyApp && ./scripts/generate-app-icons.sh
```

## Deliverables checklist

| Asset | Size(s) | Status |
|-------|---------|--------|
| App Store icon | 1024×1024 | Generated (v1) — refine with designer optional |
| iOS AppIcon set | 20–1024 pt @2x/@3x | Wired via script → `ios/.../AppIcon.appiconset` |
| Android mipmaps | 48–192 dp | Wired via script → `res/mipmap-*` |
| Expo / EAS | `app.json` → `icon` + `adaptiveIcon` | Wired |
| In-app mark | `RallyMark` component | Uses same PNG |
| Splash / launch | `LaunchScreen.storyboard` | Text + brand bg (v1) |

## Sport icons (in-app)

Use **MaterialCommunityIcons** via `SportIcon` — not emoji, not the app icon.

| Sport | Icon name |
|-------|-----------|
| Pickleball | `tennis` (until custom paddle SVG) |
| Basketball | `basketball` |
| Badminton | `badminton` |
| Tennis | `tennis-ball` |
| Running | `run` |
| Hiking | `hiking` |

Future: replace pickleball with custom SVG in `assets/branding/sports/`.

## Do / Don’t

**Do:** Simple geometry, green + one coral accent, test at 29×29 on device home screen.

**Don’t:** Emoji, photorealistic balls, “Rally” wordmark in icon, sport-specific mascot, purple gradients.

## Revision process

1. Designer exports new `icon-1024.png` → replace master in `assets/branding/`
2. Run `./scripts/generate-app-icons.sh`
3. Rebuild native app (EAS preview/production) — JS-only reload does **not** update home-screen icon
4. Update `RallyMark` automatically picks up new PNG via `require()`
