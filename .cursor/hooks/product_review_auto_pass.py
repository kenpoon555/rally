#!/usr/bin/env python3
"""Decide whether consolidator pack can auto-pass human gate (Layer 1 → Layer 2)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from product_review_chain_lib import SESSION_PATH, load_session, save_session

APPROVE_VERDICTS = frozenset({"approve_ready", "approve_with_notes"})
STOP_VERDICTS = frozenset({"revise_consolidator", "block"})

# Risk cell labels that block auto-pass (whole-word match in risk column).
STOP_RISK_LABELS = frozenset({"conflict", "creep", "timing", "block", "vague"})

# Phrases in Recommendation that negate a stop label on summary rows (e.g. "no creep").
NEGATED_RISK_PHRASES = (
    "none —",
    "none -",
    "no creep",
    "not launch-week",
    "parallel-safe",
    "compatible",
    "do not contradict",
    "legal ok",
    "$0",
)

DEFAULT_HUMAN_DECISIONS = {
    "R1": "A",  # Profile Family when flag on + zero children
    "R2": "A",  # Fix Family visibility (Profile-first)
    "R3": "A",  # Force-hide teen coach surfaces
}


def _read_pre_approve(path: Path) -> str:
    if not path.is_file():
        return ""
    return path.read_text(encoding="utf-8")


def _parse_verdict(text: str) -> str | None:
    m = re.search(
        r"## Verdict\s*\n+\*\*(approve_ready|approve_with_notes|revise_consolidator|block)\*\*",
        text,
        re.IGNORECASE,
    )
    if m:
        return m.group(1).lower()
    m = re.search(
        r"\*\*(approve_ready|approve_with_notes|revise_consolidator|block)\*\*",
        text,
        re.IGNORECASE,
    )
    return m.group(1).lower() if m else None


def _parse_coverage_gap(text: str) -> bool:
    """True if a persona row has a material gap in the Coverage table."""
    in_table = False
    section = []
    for line in text.splitlines():
        if line.strip().startswith("## Coverage"):
            in_table = True
            continue
        if in_table and line.strip().startswith("## "):
            break
        if in_table:
            section.append(line)
        if not in_table or not line.strip().startswith("|"):
            continue
        if re.match(r"^\|\s*-+\s*\|", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 5 or cells[0].lower() in ("persona-id", ""):
            continue
        gap = cells[4].lower()
        if not gap:
            continue
        allowed = (
            "none",
            "—",
            "-",
            "n/a",
            "acceptable defer",
            "ok defer",
            "copy-only",
            "legal stop documented",
            "legal stop",
        )
        if any(a in gap for a in allowed):
            continue
        return True
    body = "\n".join(section)
    if re.search(r"6/6 personas|no silent drops", body, re.IGNORECASE):
        return False
    if re.search(r"silent drop|theme dropped|not in synthesis", body, re.IGNORECASE):
        return True
    return False


def _parse_contract_risk_rows(text: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    in_table = False
    for line in text.splitlines():
        if line.strip().startswith("## Contract PR risk"):
            in_table = True
            continue
        if in_table and line.strip().startswith("## "):
            break
        if not in_table or not line.strip().startswith("|"):
            continue
        if re.match(r"^\|\s*-+\s*\|", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 4 or cells[0].lower() in ("file", ""):
            continue
        rows.append(
            {
                "file": cells[0],
                "change": cells[1] if len(cells) > 1 else "",
                "risk": cells[2] if len(cells) > 2 else "",
                "recommendation": cells[3] if len(cells) > 3 else "",
            }
        )
    return rows


def _risk_blocks_auto_pass(risk: str, recommendation: str) -> str | None:
    risk_l = risk.lower()
    rec_l = recommendation.lower()
    if any(p in rec_l for p in NEGATED_RISK_PHRASES):
        return None
    for label in STOP_RISK_LABELS:
        if re.search(rf"\b{label}\b", risk_l):
            return label
    return None


def _h_gate_fork(text: str, session: dict) -> str | None:
    if session.get("human_decisions"):
        return None
    m = re.search(r"## Concerns for human.*?\n(.*?)(?:\n## |\Z)", text, re.DOTALL | re.IGNORECASE)
    concerns = m.group(1) if m else ""
    if re.search(r"confirm before builder|record human choice|human must choose", concerns, re.IGNORECASE):
        return "h_gate_fork"
    if re.search(r"\bH[1-4]\b.*\?(?!.*recommended)", concerns, re.IGNORECASE):
        return "h_gate_fork"
    return None


def evaluate(session: dict | None = None) -> dict:
    session = session or load_session() or {}
    reasons: list[str] = []
    stop_reasons: list[str] = []

    if not session.get("auto_pass_enabled", True):
        stop_reasons.append("auto_pass_disabled")

    verdict = (session.get("pre_approve_verdict") or "").lower()
    review_rel = session.get("pre_approve_review_path") or ""
    review_path = Path(review_rel) if review_rel else None
    text = _read_pre_approve(review_path) if review_path else ""

    if not verdict and text:
        verdict = _parse_verdict(text) or ""
    if not verdict:
        stop_reasons.append("missing_pre_approve_verdict")
    elif verdict in STOP_VERDICTS:
        stop_reasons.append(f"verdict_{verdict}")
    elif verdict not in APPROVE_VERDICTS:
        stop_reasons.append(f"verdict_unknown_{verdict}")
    else:
        reasons.append(f"verdict={verdict}")

    if not review_path or not review_path.is_file():
        stop_reasons.append("missing_pre_approve_review_file")
    else:
        if _parse_coverage_gap(text):
            stop_reasons.append("coverage_gap")
        else:
            reasons.append("coverage_ok")

        for row in _parse_contract_risk_rows(text):
            hit = _risk_blocks_auto_pass(row["risk"], row["recommendation"])
            if hit:
                stop_reasons.append(f"contract_risk_{hit}:{row['file'][:40]}")

        fork = _h_gate_fork(text, session)
        if fork:
            stop_reasons.append(fork)
        elif not session.get("human_decisions"):
            reasons.append("h_gates_default_R1_R3")

        if re.search(r"\*\*Conflict check:\*\*.*contradict", text, re.IGNORECASE) and not re.search(
            r"compatible|not breaking|do not contradict green", text, re.IGNORECASE
        ):
            stop_reasons.append("conflict_check_fail")

    eligible = len(stop_reasons) == 0
    return {
        "eligible": eligible,
        "reasons": reasons,
        "stop_reasons": stop_reasons,
        "verdict": verdict,
        "review_path": str(review_path) if review_path else None,
    }


def mark_approved(session: dict, *, auto_passed: bool, evaluation: dict) -> None:
    session["phase"] = "approved"
    session["status"] = "approved"
    session["auto_passed"] = auto_passed
    if auto_passed:
        session["auto_pass_reason"] = "; ".join(evaluation.get("reasons") or [])
        session.setdefault("human_decisions", dict(DEFAULT_HUMAN_DECISIONS))
    session["layer_2_status"] = "pending"
    save_session(session)


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate or apply product-review auto-pass.")
    parser.add_argument("--apply", action="store_true", help="Mark approved when eligible")
    parser.add_argument("--json", action="store_true", help="Print JSON result")
    args = parser.parse_args()

    session = load_session()
    if not session:
        print("No session — run product-review-loop-start.sh first", file=sys.stderr)
        return 1

    result = evaluate(session)
    if args.apply:
        if not result["eligible"]:
            print("auto_pass=blocked", file=sys.stderr)
            for s in result["stop_reasons"]:
                print(f"  - {s}", file=sys.stderr)
            return 2
        mark_approved(session, auto_passed=True, evaluation=result)
        result["applied"] = True
        print("auto_pass=applied")
    else:
        print(f"auto_pass={'eligible' if result['eligible'] else 'blocked'}")
        if result["stop_reasons"]:
            for s in result["stop_reasons"]:
                print(f"  stop: {s}")

    if args.json:
        print(json.dumps(result, indent=2))
    return 0 if result["eligible"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
