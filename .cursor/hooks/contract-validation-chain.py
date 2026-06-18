#!/usr/bin/env python3
"""Stop hook (backup): chain Validator → Fixer → Validator via validation-chain-lib."""

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
    _ = sys.stdin.read()

    session = _lib.load_session()
    if not session or not session.get("chain_enabled"):
        print("{}")
        return

    nxt = _lib.compute_next(session)
    _lib.write_next_md(session, nxt)

    prompt = nxt.get("prompt") or ""
    if nxt.get("action") == "stop":
        reason = nxt.get("reason", "")
        if reason.startswith("VALIDATION_GREEN"):
            print(json.dumps({"followup_message": reason}))
        else:
            print("{}")
        return

    if prompt:
        print(json.dumps({"followup_message": prompt}))
        return

    print("{}")


if __name__ == "__main__":
    main()
