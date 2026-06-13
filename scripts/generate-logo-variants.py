#!/usr/bin/env python3
"""Generate 3 logo color variants on cream for design review."""

from __future__ import annotations

import math
from pathlib import Path
from typing import Literal

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
REVIEW_DIR = ROOT / 'docs' / 'design-review' / 'logo'

CREAM = (245, 244, 240)
PRIMARY = (11, 122, 94)  # #0B7A5E
PRIMARY_DARK = (6, 95, 73)  # #065F49
BALL_MUTED = (201, 137, 110)  # #C9896E

Variant = Literal['monochrome', 'soft_dual', 'green_only']


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


def draw_variant(variant: Variant, size: int = 1024) -> Image.Image:
    """Two embracing arcs, no head dots — refined weight and tighter hug."""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = size / 2, size / 2
    s = size / 100.0

    ball_r = 18.0 * s
    arc_r = 29.0 * s
    stroke = 5.8 * s

    if variant == 'monochrome':
        figure = PRIMARY_DARK
    elif variant == 'soft_dual':
        figure = PRIMARY_DARK
    else:
        figure = PRIMARY

    _draw_thick_arc(d, cx, cy, arc_r, 62, 203, figure, stroke)
    _draw_thick_arc(d, cx, cy, arc_r, 244, 20, figure, stroke)

    if variant == 'monochrome':
        # Negative-space ball — transparent center reads as cream on preview
        pass
    elif variant == 'soft_dual':
        _stamp_circle(d, cx, cy, ball_r, BALL_MUTED)
    else:
        _stamp_circle(d, cx, cy, ball_r, PRIMARY)

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


def on_cream(mark: Image.Image, canvas: int = 400, mark_px: int = 280) -> Image.Image:
    bg = Image.new('RGBA', (canvas, canvas), (*CREAM, 255))
    scaled = mark.resize((mark_px, mark_px), Image.Resampling.LANCZOS)
    offset = (canvas - mark_px) // 2
    bg.paste(scaled, (offset, offset), scaled)
    return bg


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
        '/System/Library/Fonts/Supplemental/Arial.ttf',
        '/Library/Fonts/Arial.ttf',
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def comparison_sheet(variants: list[tuple[str, str, Image.Image]]) -> Image.Image:
    """Horizontal comparison with labels."""
    cell_w, cell_h = 400, 460
    label_h = 80
    sheet = Image.new('RGBA', (cell_w * len(variants), cell_h), (*CREAM, 255))
    title_font = _font(15)
    sub_font = _font(12)
    draw = ImageDraw.Draw(sheet)

    for i, (title, subtitle, mark) in enumerate(variants):
        cell = on_cream(mark, canvas=cell_w, mark_px=280)
        sheet.paste(cell, (i * cell_w, 0))
        tx = i * cell_w + 20
        draw.text((tx, 368), title, fill=(20, 25, 22), font=title_font)
        draw.text((tx, 392), subtitle, fill=(90, 99, 94), font=sub_font)

    return sheet


def main() -> None:
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)

    specs: list[tuple[Variant, str, str, str]] = [
        (
            'monochrome',
            'A · Monochrome court',
            '#065F49 figures · cream ball cutout',
            '16_logo_variant_a_monochrome.png',
        ),
        (
            'soft_dual',
            'B · Soft dual',
            '#065F49 people · #C9896E muted ball',
            '16_logo_variant_b_soft_dual.png',
        ),
        (
            'green_only',
            'C · Green only',
            'All #0B7A5E · no second color',
            '16_logo_variant_c_green_only.png',
        ),
    ]

    comparison_items: list[tuple[str, str, Image.Image]] = []

    for variant, title, subtitle, filename in specs:
        mark = trim_to_square(draw_variant(variant))
        preview = on_cream(mark)
        preview.save(REVIEW_DIR / filename)
        comparison_items.append((title, subtitle, mark))
        print(f'Wrote {REVIEW_DIR / filename}')

    sheet = comparison_sheet(comparison_items)
    sheet.save(REVIEW_DIR / '16_logo_variants_comparison.png')
    print(f'Wrote {REVIEW_DIR / "16_logo_variants_comparison.png"}')


if __name__ == '__main__':
    main()
