#!/usr/bin/env python3
"""CLI: compute next validation-chain step. Agents run this after every session write."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

_LIB = Path(__file__).resolve().parent / "validation-chain-lib.py"
_spec = importlib.util.spec_from_file_location("validation_chain_lib", _LIB)
_lib = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_lib)


def main() -> None:
    session = _lib.load_session()
    if not session:
        print(json.dumps({"action": "stop", "reason": "no_session", "prompt": ""}))
        sys.exit(0)

    nxt = _lib.compute_next(session)
    _lib.write_next_md(session, nxt)

    if "--quiet" in sys.argv:
        print(nxt.get("action", "stop"))
        return

    if "--json" in sys.argv:
        print(json.dumps(nxt))
        return

    action = nxt.get("action", "stop")
    print(f"next_action={action}")
    print(f"reason={nxt.get('reason', '')}")
    if nxt.get("prompt"):
        print("---")
        print(nxt["prompt"])


if __name__ == "__main__":
    main()
