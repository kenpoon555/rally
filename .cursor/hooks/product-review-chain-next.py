#!/usr/bin/env python3
"""Print next product-review loop action after session update."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from product_review_chain_lib import compute_next, load_session, write_next_md


def main() -> int:
    session = load_session()
    if not session:
        print("No session — run product-review-loop-start.sh --queue <name>", file=sys.stderr)
        return 1
    nxt = compute_next(session)
    write_next_md(session, nxt)
    print(f"next_action={nxt['action']}")
    print(f"reason={nxt.get('reason', '')}")
    if nxt.get("prompt"):
        print("---")
        print(nxt["prompt"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
