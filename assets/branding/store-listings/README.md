# Store listing assets (App Store + Google Play)

Generated from neon concept mockups in `docs/design-review/neon-theme/`.

```bash
cd RallyApp
python3 scripts/generate-store-listing-assets.py   # needs Pillow
```

## iOS — App Store Connect

Rally is **iPhone only** (`supportsTablet: false`) — no iPad screenshots required.

| Asset | Path | Size | Upload to |
|-------|------|------|-----------|
| App icon | `ios/app-icon-1024.png` | 1024×1024 | App Information (or use `assets/branding/icon-1024.png`) |
| Screenshots (primary) | `ios/iphone-6.9-inch/01–04*.png` | 1320×2868 | **6.9" Display** slot — Apple scales to smaller iPhones |
| Screenshots (fallback) | `ios/iphone-6.7-inch/01–04*.png` | 1290×2796 | Optional; same screens at legacy 6.7" size |

Upload **at least 2**, up to 10 screenshots. Recommended order: welcome → play → profile → inbox.

## Google Play — Main store listing

| Asset | Path | Size | Required? |
|-------|------|------|-----------|
| App icon | `play/icon-512.png` | 512×512 | Yes |
| Feature graphic | `play/feature-graphic-1024x500.png` | 1024×500 | Yes |
| Phone screenshots | `play/phone/01–04*.png` | 1080×1920 | **Yes — min 2** |
| 7" tablet | `play/tablet-7-inch/01–04*.png` | 1200×1920 | Optional (phone-only app) |
| 10" tablet | `play/tablet-10-inch/01–04*.png` | 1440×2560 | Optional (phone-only app) |

**Play Console error “Upload at least 2 phone or tablet screenshots”** — upload **`play/phone/`** screenshots to the **Phone** section first. Tablet slots are optional for phone-only apps; the error clears once 2+ phone screenshots are saved.

## Screens

| File | Screen |
|------|--------|
| `01-welcome.png` | Onboarding — “Play together” |
| `02-play.png` | Play tab — open games near you |
| `03-profile.png` | Profile — stats, trust, create game |
| `04-inbox.png` | Inbox — messages |

## Legacy flat filenames

Older `play-store-screenshot-*.png` at this folder root are deprecated; regenerate and use `play/phone/` instead.
