#!/usr/bin/env python3
"""Normalize ASCII wireframes in screen_opinion.md for Screen preview.

- Pads every row to a fixed width (31 chars)
- Aligns nested card borders with inner │ columns
- Leaves prose ```text blocks unchanged

Usage: python3 scripts/fix-screen-wireframes.py [path/to/screen_opinion.md]
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

WIRE_CHARS = set("│┌└├─┐┘┬┴┼")
DEFAULT_WIDTH = 31


def is_wireframe(block: str) -> bool:
    return any(c in WIRE_CHARS for c in block)


def border_width(line: str) -> int | None:
    m = re.fullmatch(r"([┌└])(─+)([┐┘])", line)
    if m:
        return len(m.group(2)) + 2
    return None


def fix_wireframe_block(body: str, width: int = DEFAULT_WIDTH) -> str:
    lines = body.strip().split("\n")
    target = width - 2
    nest_dashes = width - 6
    nest_text = width - 8

    fixed: list[str] = []
    for line in lines:
        s = line.rstrip()
        if not s:
            continue
        if border_width(s):
            n = width - 2
            fixed.append(("┌" if s[0] == "┌" else "└") + "─" * n + ("┐" if s[0] == "┌" else "┘"))
            continue

        if not (s.startswith("│") and s.endswith("│")):
            fixed.append(s)
            continue

        inner = s[1:-1]

        if re.match(r"^ ┌", inner) or inner.lstrip().startswith("┌"):
            row = f" ┌{'─' * nest_dashes}┐ ".ljust(target)
            fixed.append("│" + row + "│")
            continue
        if re.match(r"^ └", inner) or inner.lstrip().startswith("└"):
            row = f" └{'─' * nest_dashes}┘ ".ljust(target)
            fixed.append("│" + row + "│")
            continue

        if s.startswith("│ │"):
            mid = re.sub(r"^\s*│\s*", "", inner)
            mid = re.sub(r"\s*│\s*$", "", mid).strip()
            if len(mid) > nest_text:
                mid = mid[:nest_text]
            row = f" │ {mid.ljust(nest_text)} │ "
            fixed.append("│" + row + "│")
            continue

        row = inner.ljust(target) if len(inner) < target else inner[:target]
        fixed.append("│" + row + "│")

    return "\n".join(fixed)


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / "screen_opinion.md")
    text = path.read_text()

    def replacer(m: re.Match[str]) -> str:
        body = m.group(1)
        if not is_wireframe(body):
            return m.group(0)
        return "```text\n" + fix_wireframe_block(body) + "\n```"

    new_text = re.sub(r"```text\n(.*?)```", replacer, text, flags=re.DOTALL)
    path.write_text(new_text)
    print(f"Updated {path}")


if __name__ == "__main__":
    main()
