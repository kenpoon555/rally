# Rally logo — candidates & production

Central place to compare marks before shipping. **Revisit anytime** — drop new exports into `candidates/` and add a row to the table below.

## Production (shipped in app)

These stay at `assets/branding/` root so `RallyMark`, EAS, and icon scripts keep working:

| File | Use |
|------|-----|
| [../rally-mark-1024.png](../rally-mark-1024.png) | In-app `RallyMark` (variant B — soft dual / court fresh) |
| [../icon-1024.png](../icon-1024.png) | App Store + master icon |
| [../icon-android-foreground.png](../icon-android-foreground.png) | Android adaptive foreground |

Regenerate production masters:

```bash
cd RallyApp
python3 scripts/generate-rally-mark-neon.py   # neon soft-dual → production masters + candidates
./scripts/generate-app-icons.sh             # sync ios/ + android/ mipmaps (required before EAS)
python3 scripts/generate-rally-mark.py        # legacy court-fresh (deprecated)
```

## Candidates (not shipped)

| Folder | Description | Preview on cream |
|--------|-------------|------------------|
| [candidates/legacy-court-fresh/](./candidates/legacy-court-fresh/) | Original generated mark sizes (64–512) | [docs/design-review/logo/12_logo_warm_people_ball.png](../../docs/design-review/logo/12_logo_warm_people_ball.png) |
| [candidates/neon-soft-dual/](./candidates/neon-soft-dual/) | **Recommended neon** — legacy soft-dual shape, `#6B8F1E` arcs + `#FCFD59` ball | [docs/design-review/logo/neon-theme/rally-mark-neon-soft-dual_on_bg.png](../../docs/design-review/logo/neon-theme/rally-mark-neon-soft-dual_on_bg.png) |
| [candidates/neon-solo/](./candidates/neon-solo/) | Early experiment (spiral) — superseded | — |
| [candidates/neon-duo/](./candidates/neon-duo/) | Early experiment — superseded | — |
| [source/rally-mark.svg](./source/rally-mark.svg) | Vector source (if redrawing) | — |

## Design review boards

Comparisons, designer exports, and variant studies:

**[docs/design-review/logo/](../../docs/design-review/logo/)**

- `11_logo_comparison.png` — three-way (designer / app / concept)
- `16_logo_variants_comparison.png` — monochrome / soft dual / green only
- `neon-theme/logo_candidates_comparison.png` — neon solo vs duo

## How to promote a candidate

1. Export **1024×1024** PNG (sRGB, mark in center ~80% safe zone).
2. Replace `assets/branding/rally-mark-1024.png` and `icon-1024.png` (or run generator).
3. Run `./scripts/generate-app-icons.sh` and rebuild native (EAS / Xcode).
4. Move old production PNG into `candidates/archive-YYYY-MM/` if you want to keep it.

## Related docs

- [docs/design/icon-asset-brief.md](../../docs/design/icon-asset-brief.md) — brand rules
- [docs/design-review/DESIGN_REVIEW_v2.md](../../docs/design-review/DESIGN_REVIEW_v2.md) — logo direction + screen mocks
