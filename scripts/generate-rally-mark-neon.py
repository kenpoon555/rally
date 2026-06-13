#!/usr/bin/env python3
"""Generate Rally mark — legacy soft-dual shape in neon theme colors."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES_DIR = ROOT / 'assets' / 'branding' / 'logo' / 'candidates' / 'neon-soft-dual'
REVIEW_DIR = ROOT / 'docs' / 'design-review' / 'logo' / 'neon-theme'
SOURCE_DIR = ROOT / 'assets' / 'branding' / 'logo' / 'source'

# Neon theme — same geometry as legacy variant B, new palette (theme.ts / COLORS.md)
FIGURE = (107, 143, 30)  # #6B8F1E primaryDark (green arcs, like legacy)
BALL = (252, 253, 89)  # #FCFD59 accent yellow (replaces coral ball)
CANVAS = (238, 237, 235)  # #EEEDEB app background


def _stamp_circle(d: ImageDraw.ImageDraw, x: float, y: float, r: float, color: tuple[int, int, int]) -> None:
    d.ellipse([x - r, y - r, x + r, y + r], fill=color)


def _draw_thick_arc(
    d: ImageDraw.ImageDraw,
    cx: float,
    cy: float,
    radius: float,
    start_deg: float,
    end_deg: float,
    color: tuple[int, int, int],
    width: float,
) -> None:
    sweep = (end_deg - start_deg) % 360
    if sweep == 0:
        sweep = 360
    steps = max(56, int(sweep * 1.5))
    half = width / 2
    for i in range(steps + 1):
        t = math.radians((start_deg + sweep * i / steps) % 360)
        x = cx + radius * math.cos(t)
        y = cy - radius * math.sin(t)
        _stamp_circle(d, x, y, half, color)


def draw_mark(size: int = 1024) -> Image.Image:
    """Two embracing arcs + accent ball — identical layout to legacy soft dual."""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = size / 2, size / 2
    s = size / 100.0

    ball_r = 18.0 * s
    arc_r = 29.0 * s
    stroke = 5.8 * s

    _draw_thick_arc(d, cx, cy, arc_r, 62, 203, FIGURE, stroke)
    _draw_thick_arc(d, cx, cy, arc_r, 244, 20, FIGURE, stroke)
    _stamp_circle(d, cx, cy, ball_r, BALL)
    return im


def trim_to_square(im: Image.Image, pad_ratio: float = 0.10) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    pad = int(max(x1 - x0, y1 - y0) * pad_ratio)
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad)
    y1 = min(im.height, y1 + pad)
    cropped = im.crop((x0, y0, x1, y1))
    side = max(cropped.size)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    square.paste(cropped, ((side - cropped.width) // 2, (side - cropped.height) // 2))
    return square


def on_background(mark: Image.Image, bg: tuple[int, int, int], canvas: int = 1024, mark_scale: float = 0.72) -> Image.Image:
    out = Image.new('RGB', (canvas, canvas), bg)
    mark_px = int(canvas * mark_scale)
    scaled = mark.resize((mark_px, mark_px), Image.Resampling.LANCZOS)
    offset = (canvas - mark_px) // 2
    out.paste(scaled, (offset, offset), scaled)
    return out


def comparison_sheet() -> Image.Image:
    """Legacy court-fresh vs neon soft-dual on each theme background."""
    legacy_path = ROOT / 'assets' / 'branding' / 'logo' / 'candidates' / 'legacy-court-fresh' / 'rally-mark-256.png'
    neon = trim_to_square(draw_mark(512))
    legacy = Image.open(legacy_path).convert('RGBA') if legacy_path.exists() else neon

    court_bg = (245, 244, 240)
    cell = 280
    sheet = Image.new('RGB', (cell * 2 + 40, cell + 80), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    d.text((20, 12), 'Court Fresh (legacy)', fill=(90, 90, 90))
    d.text((cell + 30, 12), 'Neon soft dual (new)', fill=(90, 90, 90))

    for col, (mark, bg) in enumerate(
        [
            (legacy, court_bg),
            (neon, CANVAS),
        ]
    ):
        tile = Image.new('RGB', (cell, cell), bg)
        scaled = mark.resize((180, 180), Image.Resampling.LANCZOS)
        tile.paste(scaled, ((cell - 180) // 2, (cell - 180) // 2), scaled)
        sheet.paste(tile, (20 + col * (cell + 20), 40))

    return sheet


def write_svg() -> None:
    svg = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <!-- Rally mark — neon soft dual (legacy geometry, neon palette) -->
  <g stroke="#6B8F1E" stroke-linecap="round" fill="#6B8F1E">
    <path d="M 62.8 25.8 A 29 29 0 0 1 25.8 62.8" stroke-width="5.8" fill="none"/>
    <path d="M 37.2 74.2 A 29 29 0 0 1 74.2 37.2" stroke-width="5.8" fill="none"/>
  </g>
  <circle cx="50" cy="50" r="18" fill="#FCFD59"/>
</svg>
"""
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    (SOURCE_DIR / 'rally-mark-neon-soft-dual.svg').write_text(svg, encoding='utf-8')


def main() -> None:
    CANDIDATES_DIR.mkdir(parents=True, exist_ok=True)
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)

    master = trim_to_square(draw_mark(1024))
    master.save(CANDIDATES_DIR / 'rally-mark-neon-soft-dual-1024.png')

    for sz in (512, 256, 128, 64):
        master.resize((sz, sz), Image.Resampling.LANCZOS).save(
            CANDIDATES_DIR / f'rally-mark-neon-soft-dual-{sz}.png'
        )

    on_background(master, CANVAS).save(REVIEW_DIR / 'rally-mark-neon-soft-dual_on_bg.png', optimize=True)
    on_background(master, CANVAS, canvas=600, mark_scale=0.62).save(
        REVIEW_DIR / 'rally-mark-neon-soft-dual_on_bg_preview.png',
        optimize=True,
    )
    comparison_sheet().save(REVIEW_DIR / 'legacy_vs_neon_soft_dual.png', optimize=True)
    write_svg()

    print(f'Wrote neon soft-dual mark to {CANDIDATES_DIR}')
    print(f'Previews in {REVIEW_DIR}')


if __name__ == '__main__':
    main()
