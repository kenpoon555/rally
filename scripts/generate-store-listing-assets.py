#!/usr/bin/env python3
"""Generate App Store + Play Store listing assets from neon concept mockups."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CONCEPTS = ROOT / 'docs/design-review/neon-theme'
OUT = ROOT / 'assets/branding/store-listings'
BRANDING = ROOT / 'assets/branding'

SCREENS = [
    ('concept_neon_welcome.png', '01-welcome'),
    ('concept_neon_play_games.png', '02-play'),
    ('concept_neon_profile.png', '03-profile'),
    ('concept_neon_inbox.png', '04-inbox'),
]

EXPORTS = {
    'ios/iphone-6.9-inch': (1320, 2868),
    'ios/iphone-6.7-inch': (1290, 2796),
    'play/phone': (1080, 1920),
    'play/tablet-7-inch': (1200, 1920),
    'play/tablet-10-inch': (1440, 2560),
}


def crop_phone_portrait(im: Image.Image, target: tuple[int, int]) -> Image.Image:
    """Crop centered phone from 1536×1024 concept mockup, then scale to target size."""
    w, h = im.size
    bg = im.getpixel((10, 10))
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            p = im.getpixel((x, y))
            if sum(abs(p[i] - bg[i]) for i in range(3)) > 25:
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    crop_h = maxy - miny
    cx = (minx + maxx) // 2
    crop_w = int(crop_h * 9 / 19.5)
    left = max(0, cx - crop_w // 2)
    right = min(w, left + crop_w)
    cropped = im.crop((left, miny, right, maxy))
    return cropped.resize(target, Image.Resampling.LANCZOS)


def export_screenshot(src: Path, dest: Path, target: tuple[int, int]) -> None:
    im = Image.open(src).convert('RGB')
    cropped = crop_phone_portrait(im, target)
    dest.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(dest, format='PNG', optimize=True)


def copy_static_assets() -> None:
    ios_icon_src = BRANDING / 'icon-1024.png'
    if ios_icon_src.exists():
        dest = OUT / 'ios' / 'app-icon-1024.png'
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ios_icon_src, dest)
        print('Copied', dest.relative_to(OUT))

        play_icon = OUT / 'play' / 'icon-512.png'
        play_icon.parent.mkdir(parents=True, exist_ok=True)
        icon = Image.open(ios_icon_src).convert('RGB')
        icon.resize((512, 512), Image.Resampling.LANCZOS).save(play_icon, format='PNG', optimize=True)
        print('Wrote', play_icon.relative_to(OUT), (512, 512))
    else:
        print('SKIP missing', ios_icon_src)

    feature = OUT / 'play' / 'feature-graphic-1024x500.png'
    if not feature.exists():
        print('WARN missing feature graphic — add play/feature-graphic-1024x500.png manually')


def main() -> None:
    for folder, size in EXPORTS.items():
        for src_name, stem in SCREENS:
            src = CONCEPTS / src_name
            if not src.exists():
                print('SKIP missing concept', src)
                continue
            dest = OUT / folder / f'{stem}.png'
            export_screenshot(src, dest, size)
            print('Wrote', dest.relative_to(OUT), size)

    copy_static_assets()


if __name__ == '__main__':
    main()
