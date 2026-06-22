#!/usr/bin/env python3
"""Stop-hook: auto-continue validation + product-review chains (backup to agent self-chain)."""

from __future__ import annotations

import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PR_SESSION = ROOT / "docs" / "product-review" / ".product-review-session.json"


def _load_lib(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_val = _load_lib("validation_chain_lib", Path(__file__).resolve().parent / "validation-chain-lib.py")
_pr = _load_lib("product_review_chain_lib", Path(__file__).resolve().parent / "product_review_chain_lib.py")


def _followup(prefix: str, nxt: dict) -> None:
    action = nxt.get("action", "stop")
    prompt = (nxt.get("prompt") or "").strip()
    reason = nxt.get("reason", "")

    if action == "stop":
        if reason.startswith("VALIDATION_GREEN"):
            print(json.dumps({"followup_message": f"{prefix} {reason}. Continue next contract if queue remains."}))
        return

    if prompt:
        msg = f"{prefix}\n\n{prompt}" if prefix else prompt
        print(json.dumps({"followup_message": msg}))
        return

    print("{}")


def main() -> None:
    _ = sys.stdin.read()

    val = _val.load_session()
    if val and val.get("chain_enabled"):
        nxt = _val.compute_next(val)
        _val.write_next_md(val, nxt)
        _followup(
            "Rally validation loop — continue in this same chat (do not ask human to say continue):",
            nxt,
        )
        return

    if PR_SESSION.is_file():
        try:
            pr = json.loads(PR_SESSION.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pr = None
        if pr and pr.get("chain_enabled"):
            nxt = _pr.compute_next(pr)
            _pr.write_next_md(pr, nxt)
            _followup(
                "Rally product-review loop — continue in this same chat:",
                nxt,
            )
            return

    print("{}")


if __name__ == "__main__":
    main()
