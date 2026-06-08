#!/usr/bin/env python3
"""Build OS icon masters from rally-mark.svg (canonical brand geometry)."""
from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    raise SystemExit('Install Pillow: pip install Pillow')

ROOT = Path(__file__).resolve().parents[1]
BRANDING = ROOT / 'assets' / 'branding'
SVG = BRANDING / 'rally-mark.svg'
SIZE = 1024
CREAM = (245, 244, 240)  # #F5F4F0
# Adaptive icon safe zone ~66% diameter; iOS looks fine with ~72% mark width.
IOS_MARK_SCALE = 0.72
ANDROID_FG_SCALE = 0.62


def render_mark_rgba(scale: float) -> Image.Image:
    """Rasterize rally-mark.svg by drawing the same paths (no external SVG deps)."""
    side = int(SIZE * scale)
    img = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    green = (6, 95, 73, 255)  # #065F49
    terracotta = (201, 137, 110, 255)  # #C9896E

    def map_pt(x: float, y: float) -> tuple[float, float]:
        return x / 100 * side, y / 100 * side

    # Arcs from rally-mark.svg (stroke-width 5.8 in 100x100 viewBox)
    stroke = max(2, int(5.8 / 100 * side))
    arc_r = 29 / 100 * side
    cx, cy = side / 2, side / 2

    bbox_outer = (cx - arc_r, cy - arc_r, cx + arc_r, cy + arc_r)
    # Upper-left arc
    draw.arc(bbox_outer, start=300, end=90, fill=green, width=stroke)
    # Lower-right arc
    draw.arc(bbox_outer, start=120, end=210, fill=green, width=stroke)

    dot_r = 18 / 100 * side
    draw.ellipse((cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r), fill=terracotta)
    return img


def paste_center(canvas: Image.Image, mark: Image.Image) -> None:
    x = (canvas.width - mark.width) // 2
    y = (canvas.height - mark.height) // 2
    canvas.paste(mark, (x, y), mark)


def main() -> None:
    BRANDING.mkdir(parents=True, exist_ok=True)

    ios_mark = render_mark_rgba(IOS_MARK_SCALE)
    ios_icon = Image.new('RGB', (SIZE, SIZE), CREAM)
    paste_center(ios_icon, ios_mark)
    ios_path = BRANDING / 'icon-1024.png'
    ios_icon.save(ios_path, format='PNG', optimize=True)

    android_mark = render_mark_rgba(ANDROID_FG_SCALE)
    android_fg = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    paste_center(android_fg, android_mark)
    android_fg_path = BRANDING / 'icon-android-foreground.png'
    android_fg.save(android_fg_path, format='PNG', optimize=True)

    in_app_mark = render_mark_rgba(0.88)
    in_app_path = BRANDING / 'rally-mark-1024.png'
    in_app_mark.save(in_app_path, format='PNG', optimize=True)

    print(f'Wrote {ios_path}')
    print(f'Wrote {android_fg_path}')
    print(f'Wrote {in_app_path}')


if __name__ == '__main__':
    main()
