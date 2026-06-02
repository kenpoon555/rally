#!/usr/bin/env python3
"""Scale app icon artwork to fill iOS/Android home-screen safe zones (center crop zoom)."""
from __future__ import annotations

import os
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit('pip install Pillow')

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets' / 'branding' / 'icon-1024.png'
OUT = ROOT / 'assets' / 'branding' / 'icon-1024.png'
ANDROID_FG = ROOT / 'assets' / 'branding' / 'icon-android-foreground.png'
SIZE = 1024
# Android adaptive icon visible area ~66%; iOS applies mask — slight zoom helps both.
ZOOM = 1.42


def zoom_center(im: Image.Image, factor: float) -> Image.Image:
    w, h = im.size
    nw, nh = int(w * factor), int(h * factor)
    scaled = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - w) // 2
    top = (nh - h) // 2
    return scaled.crop((left, top, left + w, top + h))


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f'Missing source icon: {SRC}')
    im = Image.open(SRC).convert('RGB')
    full = zoom_center(im, ZOOM)
    full.save(OUT, format='PNG', optimize=True)
    full.save(ANDROID_FG, format='PNG', optimize=True)
    print(f'Wrote {OUT} and {ANDROID_FG} at zoom {ZOOM}')


if __name__ == '__main__':
    main()
