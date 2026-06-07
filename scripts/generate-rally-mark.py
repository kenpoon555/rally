#!/usr/bin/env python3
"""Generate Rally mark (variant B — soft dual) and app icon masters."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / 'assets' / 'branding'
REVIEW_DIR = ROOT / 'docs' / 'design-review'

# Variant B — soft dual (shipped mark)
FIGURE = (6, 95, 73)  # #065F49 primaryDark
BALL = (201, 137, 110)  # #C9896E muted accent
CREAM = (245, 244, 240)  # #F5F4F0 background


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
    """Two embracing arcs + muted ball. No head dots."""
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


def on_cream(mark: Image.Image, canvas: int = 1024, mark_scale: float = 0.72) -> Image.Image:
    """App icon master — cream background, no transparency (iOS App Store)."""
    bg = Image.new('RGB', (canvas, canvas), CREAM)
    mark_px = int(canvas * mark_scale)
    scaled = mark.resize((mark_px, mark_px), Image.Resampling.LANCZOS)
    offset = (canvas - mark_px) // 2
    bg.paste(scaled, (offset, offset), scaled)
    return bg


def android_foreground(mark: Image.Image, canvas: int = 1024, mark_scale: float = 0.78) -> Image.Image:
    """Transparent foreground for Android adaptive icon."""
    fg = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0))
    mark_px = int(canvas * mark_scale)
    scaled = mark.resize((mark_px, mark_px), Image.Resampling.LANCZOS)
    offset = (canvas - mark_px) // 2
    fg.paste(scaled, (offset, offset), scaled)
    return fg


def cream_preview(mark: Image.Image, size: int = 600, mark_px: int = 360) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), (*CREAM, 255))
    scaled = mark.resize((mark_px, mark_px), Image.Resampling.LANCZOS)
    offset = (size - mark_px) // 2
    canvas.paste(scaled, (offset, offset), scaled)
    return canvas


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)

    master = trim_to_square(draw_mark(1024))
    master.save(OUT_DIR / 'rally-mark-1024.png')

    for sz in (512, 256, 128, 64):
        master.resize((sz, sz), Image.Resampling.LANCZOS).save(OUT_DIR / f'rally-mark-{sz}.png')

    on_cream(master).save(OUT_DIR / 'icon-1024.png', format='PNG', optimize=True)
    android_foreground(master).save(OUT_DIR / 'icon-android-foreground.png', format='PNG', optimize=True)

    cream_preview(master).save(REVIEW_DIR / '12_logo_warm_people_ball.png')
    cream_preview(master).save(REVIEW_DIR / '16_logo_variant_b_soft_dual.png')

    print(f'Wrote rally-mark + icon masters to {OUT_DIR}')


if __name__ == '__main__':
    main()
