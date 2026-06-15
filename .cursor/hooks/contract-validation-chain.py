#!/usr/bin/env python3
"""Stop hook: chain Validator → Fixer → Validator using docs/contracts/.validation-session.json."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SESSION_PATH = Path("docs/contracts/.validation-session.json")
WORKFLOW = ".cursor/workflows/validate-contract.md"


def load_session() -> dict | None:
    if not SESSION_PATH.is_file():
        return None
    try:
        return json.loads(SESSION_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def save_session(session: dict) -> None:
    session["updated_at"] = datetime.now(timezone.utc).isoformat()
    SESSION_PATH.parent.mkdir(parents=True, exist_ok=True)
    SESSION_PATH.write_text(json.dumps(session, indent=2) + "\n", encoding="utf-8")


def noop() -> None:
    print("{}")
    sys.exit(0)


def followup(message: str) -> None:
    print(json.dumps({"followup_message": message}))


def normalize_failed_rows(session: dict) -> list[str]:
    """failed_rows must be strings; Validator sometimes writes row numbers by mistake."""
    raw = session.get("failed_rows") or []
    cid = session.get("contract_id", "contract")
    out: list[str] = []
    for row in raw:
        if isinstance(row, str) and row.strip():
            out.append(row.strip())
        elif isinstance(row, (int, float)):
            out.append(
                f"Checklist row {int(row)} | Fail | See Validator report in {cid} — "
                "fix seed SQL / demo ready_at / testID or a11y on session card actions for sim taps"
            )
        elif row is not None:
            out.append(str(row))
    return out


def queue_fields_snippet(session: dict) -> str:
    queue = session.get("queue")
    if not queue:
        return ""
    qname = session.get("queue_name", "")
    qidx = session.get("queue_index", 0)
    qlen = len(queue)
    return f"""
- queue_name: "{qname}"
- queue: {json.dumps(queue)}
- queue_index: {qidx}  (current: {qidx + 1}/{qlen})
Preserve queue fields exactly when updating the session file.
"""


def advance_queue(session: dict) -> str | None:
    queue = session.get("queue") or []
    idx = int(session.get("queue_index", 0))
    nxt = idx + 1
    if nxt >= len(queue):
        return None
    cid = queue[nxt]
    session["queue_index"] = nxt
    session["contract_id"] = cid
    session["contract_path"] = f"docs/contracts/{cid}.md"
    session["fixer_round"] = 0
    session["failed_rows"] = []
    session["phase"] = "validator_pending"
    session["status"] = "running"
    return cid


def handle_pass(session: dict) -> None:
    cid = session.get("contract_id")
    queue = session.get("queue") or []
    qname = session.get("queue_name")

    if queue:
        nxt = advance_queue(session)
        if nxt:
            save_session(session)
            idx = session["queue_index"]
            followup(
                f"VALIDATION_GREEN for {cid} ({idx}/{len(queue)} in queue {qname}). "
                f"Starting next contract: {nxt}. "
                + validator_prompt(session)
            )
            return
        session["phase"] = "done"
        session["chain_enabled"] = False
        session["status"] = "pass"
        save_session(session)
        followup(
            f"VALIDATION_GREEN_ALL — queue '{qname}' complete ({len(queue)} contracts). "
            "Update Last validated on each contract. "
            "Next: product review (Layer 1) or ./validation-loop-start.sh --queue phase1a"
        )
        return

    session["phase"] = "done"
    session["chain_enabled"] = False
    session["status"] = "pass"
    save_session(session)
    followup(
        f"VALIDATION_GREEN for {cid}. Chain stopped. "
        "Update the contract with Last validated date. "
        "Run ./.cursor/hooks/validation-loop-start.sh <next-id> or --queue baseline --from <id>"
    )


def validator_prompt(session: dict) -> str:
    cid = session["contract_id"]
    path = session.get("contract_path") or f"docs/contracts/{cid}.md"
    rnd = session.get("fixer_round", 0)
    queue_note = ""
    if session.get("queue"):
        idx = int(session.get("queue_index", 0))
        qlen = len(session["queue"])
        queue_note = f"\nQueue progress: {idx + 1}/{qlen} ({session.get('queue_name', '')})\n"
    return f"""You are the Validator agent for Rally contract validation.
{queue_note}
Read:
- RallyApp/{path}
- RallyApp/{WORKFLOW}
- RallyApp/docs/store-review-test-accounts.md

Validate on iOS simulator (Monrovia demo seed). Do not fix app code.

Steps:
1. npm start + iOS sim booted
2. Seed if needed: node scripts/seed-monrovia-basketball-rally-demo.mjs
3. Run every checklist row in the contract
4. Save screenshots to docs/contracts/screenshots/{cid}/
5. Return full pass/fail markdown table + failed rows only

When finished, write RallyApp/docs/contracts/.validation-session.json with:
- contract_id: "{cid}"
- contract_path: "{path}"
- phase: "validator_done"
- status: "pass" OR "fail" OR "needs_builder" OR "needs_human" OR "blocked_external"
- failed_rows: array (empty if pass)
- fixer_round: {rnd}
- max_fixer_rounds: {session.get("max_fixer_rounds", 3)}
- chain_enabled: true{queue_fields_snippet(session)}
"""


def fixer_prompt(session: dict) -> str:
    cid = session["contract_id"]
    path = session.get("contract_path") or f"docs/contracts/{cid}.md"
    rnd = session.get("fixer_round", 1)
    rows = normalize_failed_rows(session)
    rows_text = "\n".join(f"- {row}" for row in rows) if rows else "- (see last Validator table)"
    return f"""You are the Fixer agent for Rally contract validation.

Read:
- RallyApp/{path}
- RallyApp/{WORKFLOW}

Fix ONLY these failed rows from the Validator report:

{rows_text}

Rules:
- Minimal diff; contract scope only
- Do not fix passing items
- Do not re-run validation

When finished, write RallyApp/docs/contracts/.validation-session.json with:
- contract_id: "{cid}"
- contract_path: "{path}"
- phase: "fixer_done"
- status: "complete"
- failed_rows: (keep the same list you were given)
- fixer_round: {rnd}
- max_fixer_rounds: {session.get("max_fixer_rounds", 3)}
- chain_enabled: true{queue_fields_snippet(session)}
"""


def builder_prompt(session: dict) -> str:
    cid = session["contract_id"]
    path = session.get("contract_path") or f"docs/contracts/{cid}.md"
    rnd = session.get("fixer_round", 0)
    return f"""You are the Builder agent for Rally.

Read:
- RallyApp/{path}
- RallyApp/{WORKFLOW}
- Linked module contracts from {path}

Implement missing behavior until checklist items should pass. Match existing patterns.
Do not run validation.

When finished, write RallyApp/docs/contracts/.validation-session.json with:
- contract_id: "{cid}"
- contract_path: "{path}"
- phase: "builder_done"
- status: "complete"
- failed_rows: []
- fixer_round: {rnd}
- max_fixer_rounds: {session.get("max_fixer_rounds", 3)}
- chain_enabled: true{queue_fields_snippet(session)}
"""


def main() -> None:
    _ = sys.stdin.read()

    session = load_session()
    if not session or not session.get("chain_enabled"):
        noop()

    phase = session.get("phase", "")
    status = session.get("status", "")
    max_rounds = int(session.get("max_fixer_rounds", 3))
    fixer_round = int(session.get("fixer_round", 0))

    if phase == "validator_done" and status == "pass":
        handle_pass(session)
        return

    if phase == "validator_done" and status == "needs_human":
        session["phase"] = "blocked"
        session["chain_enabled"] = False
        save_session(session)
        rows = session.get("failed_rows") or []
        rows_text = "; ".join(rows) if rows else "see contract Human decision gates"
        followup(
            f"CHAIN PAUSED — human decision required for {session.get('contract_id')}. "
            f"Items: {rows_text}. "
            "Update contract H* gates, then resume: "
            f"./.cursor/hooks/validation-loop-start.sh --queue {session.get('queue_name', 'baseline')} "
            f"--from {session.get('contract_id')}"
        )
        return

    if phase == "validator_done" and status == "blocked_external":
        session["phase"] = "blocked"
        session["chain_enabled"] = False
        save_session(session)
        rows = session.get("failed_rows") or []
        rows_text = "; ".join(rows) if rows else "see contract External dependencies"
        followup(
            f"CHAIN PAUSED — external dependency blocked for {session.get('contract_id')}. "
            f"Items: {rows_text}. Fix environment, then resume queue from same contract."
        )
        return

    if phase == "validator_done" and status == "needs_builder":
        auto_builder = session.get("auto_builder") or False
        if not auto_builder:
            session["phase"] = "blocked"
            session["chain_enabled"] = False
            save_session(session)
            followup(
                f"Validator reported needs_builder for {session.get('contract_id')}. "
                "Resume with: "
                f"./.cursor/hooks/validation-loop-start.sh --queue {session.get('queue_name') or session.get('contract_id')} "
                "--builder --from " + str(session.get("contract_id"))
            )
            return
        session["phase"] = "builder_pending"
        save_session(session)
        followup(builder_prompt(session))
        return

    if phase == "builder_done":
        session["phase"] = "validator_pending"
        save_session(session)
        followup(validator_prompt(session))
        return

    if phase == "validator_done" and status == "fail":
        failed_rows = normalize_failed_rows(session)
        session["failed_rows"] = failed_rows
        if not failed_rows:
            session["phase"] = "blocked"
            session["chain_enabled"] = False
            save_session(session)
            followup(
                "Validator status is fail but failed_rows is empty. "
                "Re-run Validator and write failed_rows into .validation-session.json."
            )
            return
        if fixer_round >= max_rounds:
            session["phase"] = "blocked"
            session["chain_enabled"] = False
            session["status"] = "max_fixer_rounds"
            save_session(session)
            followup(
                f"Stopped after {max_rounds} Fixer rounds for {session.get('contract_id')}. "
                "Log blockers in contract Open issues. "
                "Resume queue after fix: "
                f"./.cursor/hooks/validation-loop-start.sh --queue {session.get('queue_name', 'baseline')} "
                f"--from {session.get('contract_id')}"
            )
            return
        fixer_round += 1
        session["fixer_round"] = fixer_round
        session["phase"] = "fixer_pending"
        save_session(session)
        followup(fixer_prompt(session))
        return

    if phase == "fixer_pending":
        followup(fixer_prompt(session))
        return

    if phase == "fixer_done":
        session["phase"] = "validator_pending"
        save_session(session)
        followup(validator_prompt(session))
        return

    noop()


if __name__ == "__main__":
    main()
