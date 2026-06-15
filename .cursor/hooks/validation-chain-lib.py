#!/usr/bin/env python3
"""Shared validation chain state machine for hook + agent self-chain."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

SESSION_PATH = Path("docs/contracts/.validation-session.json")
NEXT_PATH = Path("docs/contracts/.validation-next.md")
WORKFLOW = ".cursor/workflows/validate-contract.md"

SELF_CHAIN = """
## SELF-CHAIN (required when chain_enabled is true)

After you write `.validation-session.json`, **do not stop and do not ask the human** to invoke Fixer/Validator.

1. Run: `python3 .cursor/hooks/validation-chain-next.py`
2. Read `docs/contracts/.validation-next.md`
3. If next role is fixer/validator/builder → **continue as that role in THIS SAME TURN** (same response)
4. Only stop when next action is `stop` (green, paused, or max Fixer rounds)

Never say "tell Fixer", "re-run Validator", or "say if you want Fixer" when chain_enabled is true.
"""


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


def normalize_failed_rows(session: dict) -> list[str]:
    raw = session.get("failed_rows") or []
    cid = session.get("contract_id", "contract")
    out: list[str] = []
    for row in raw:
        if isinstance(row, str) and row.strip():
            out.append(row.strip())
        elif isinstance(row, (int, float)):
            out.append(
                f"Checklist row {int(row)} | Fail | See Validator report in {cid}"
            )
        elif row is not None:
            out.append(str(row))
    return out


def is_sim_automation_only(failed_rows: list[str]) -> bool:
    """Rows that failed on sim tap/navigation/Metro — often no code fix needed."""
    keys = (
        "sim ",
        "metro",
        "idb ",
        "automation",
        "ui tap",
        "navigation",
        "modal",
        "tap not",
        "screenshot not captured",
        "blocking tab",
    )
    blob = " ".join(failed_rows).lower()
    return bool(blob) and any(k in blob for k in keys)


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
- queue_index: {qidx}
Preserve queue fields when updating the session file.
"""


def validator_prompt(session: dict) -> str:
    cid = session["contract_id"]
    path = session.get("contract_path") or f"docs/contracts/{cid}.md"
    rnd = session.get("fixer_round", 0)
    queue_note = ""
    if session.get("queue"):
        idx = int(session.get("queue_index", 0))
        qlen = len(session["queue"])
        queue_note = f"\nQueue: {idx + 1}/{qlen} ({session.get('queue_name', '')})\n"
    sim_note = ""
    if session.get("retry_sim_automation"):
        sim_note = """
Sim-automation retry: dismiss game-card modal before host flow; login marcus with idb ui text in two chunks ('marcus@' + 'rally-mvrhoops.demo'); use testID session-card-lock-roster; human manual tap OK to confirm row if app behavior is correct.
"""
    return f"""You are the Validator agent for Rally contract validation.
{queue_note}{sim_note}
Read:
- RallyApp/{path}
- RallyApp/{WORKFLOW}
- RallyApp/docs/store-review-test-accounts.md

Validate on iOS simulator (Monrovia demo). Do not fix app code.

Steps:
1. npm start + iOS sim booted
2. Seed if needed: supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql
3. Run every checklist row; screenshots → docs/contracts/screenshots/{cid}/
4. Pass/fail table + failed_rows as **strings** (not bare numbers)

Write RallyApp/docs/contracts/.validation-session.json:
- phase: "validator_done"
- status: pass|fail|needs_builder|needs_human|blocked_external
- failed_rows: [] if pass
- fixer_round: {rnd}
- chain_enabled: true{queue_fields_snippet(session)}
{SELF_CHAIN}
"""


def fixer_prompt(session: dict) -> str:
    cid = session["contract_id"]
    path = session.get("contract_path") or f"docs/contracts/{cid}.md"
    rnd = session.get("fixer_round", 1)
    rows = normalize_failed_rows(session)
    rows_text = "\n".join(f"- {r}" for r in rows) if rows else "- (see Validator report)"
    sim_note = ""
    if is_sim_automation_only(rows):
        sim_note = """
These failures look sim-automation only. If app behavior is already correct:
- Minimal testID/a11y/navigation helpers only; OR
- Write fixer_done with failed_rows unchanged and set retry_sim_automation: true on session for Validator retry.
Do not change product logic for Metro/modal flakes.
"""
    return f"""You are the Fixer agent for Rally contract validation.
{sim_note}
Read:
- RallyApp/{path}
- RallyApp/{WORKFLOW}

Fix ONLY these failed rows:

{rows_text}

When finished, write .validation-session.json:
- phase: "fixer_done"
- status: "complete"
- fixer_round: {rnd}
- chain_enabled: true{queue_fields_snippet(session)}
{SELF_CHAIN}
"""


def builder_prompt(session: dict) -> str:
    cid = session["contract_id"]
    path = session.get("contract_path") or f"docs/contracts/{cid}.md"
    rnd = session.get("fixer_round", 0)
    return f"""You are the Builder agent for Rally.

Read RallyApp/{path} and linked contracts. Implement missing behavior. Then write session phase builder_done, chain_enabled true.
{SELF_CHAIN}
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
    session["retry_sim_automation"] = False
    session["phase"] = "validator_pending"
    session["status"] = "running"
    return cid


def compute_next(session: dict) -> dict:
    """Return {action, reason, prompt, update_session} — action in stop|fixer|validator|builder."""
    if not session.get("chain_enabled"):
        return {"action": "stop", "reason": "chain_disabled", "prompt": ""}

    phase = session.get("phase", "")
    status = session.get("status", "")
    max_rounds = int(session.get("max_fixer_rounds", 3))
    fixer_round = int(session.get("fixer_round", 0))
    failed_rows = normalize_failed_rows(session)

    if phase == "validator_done" and status == "pass":
        queue = session.get("queue") or []
        if queue:
            cid = session.get("contract_id")
            nxt = advance_queue(session)
            if nxt:
                save_session(session)
                return {
                    "action": "validator",
                    "reason": f"VALIDATION_GREEN {cid} → next queue item {nxt}",
                    "prompt": validator_prompt(session),
                }
            session["phase"] = "done"
            session["chain_enabled"] = False
            save_session(session)
            return {
                "action": "stop",
                "reason": f"VALIDATION_GREEN_ALL queue {session.get('queue_name')} complete",
                "prompt": "",
            }
        session["phase"] = "done"
        session["chain_enabled"] = False
        save_session(session)
        return {
            "action": "stop",
            "reason": f"VALIDATION_GREEN {session.get('contract_id')}",
            "prompt": "",
        }

    if phase == "validator_done" and status == "needs_human":
        session["phase"] = "blocked"
        session["chain_enabled"] = False
        save_session(session)
        return {"action": "stop", "reason": "CHAIN_PAUSED needs_human", "prompt": ""}

    if phase == "validator_done" and status == "blocked_external":
        session["phase"] = "blocked"
        session["chain_enabled"] = False
        save_session(session)
        return {"action": "stop", "reason": "CHAIN_PAUSED blocked_external", "prompt": ""}

    if phase == "validator_done" and status == "needs_builder":
        if session.get("auto_builder"):
            session["phase"] = "builder_pending"
            save_session(session)
            return {"action": "builder", "reason": "needs_builder", "prompt": builder_prompt(session)}
        session["phase"] = "blocked"
        session["chain_enabled"] = False
        save_session(session)
        return {"action": "stop", "reason": "CHAIN_PAUSED needs_builder", "prompt": ""}

    if phase == "fixer_done":
        session["phase"] = "validator_pending"
        session["retry_sim_automation"] = session.get("retry_sim_automation", False)
        save_session(session)
        return {"action": "validator", "reason": "fixer_done → re-validate", "prompt": validator_prompt(session)}

    if phase == "builder_done":
        session["phase"] = "validator_pending"
        save_session(session)
        return {"action": "validator", "reason": "builder_done → validate", "prompt": validator_prompt(session)}

    if phase in ("fixer_pending",) or (phase == "validator_done" and status == "fail"):
        if not failed_rows and phase == "validator_done":
            return {"action": "stop", "reason": "fail with empty failed_rows", "prompt": ""}

        # Sim-only: retry Validator without burning another Fixer round if we already fixed code once
        if (
            phase == "validator_done"
            and status == "fail"
            and fixer_round >= 1
            and is_sim_automation_only(failed_rows)
            and not session.get("sim_retry_used")
        ):
            session["sim_retry_used"] = True
            session["retry_sim_automation"] = True
            session["phase"] = "validator_pending"
            save_session(session)
            return {
                "action": "validator",
                "reason": "sim_automation retry (no Fixer round consumed)",
                "prompt": validator_prompt(session),
            }

        if phase == "validator_done" and fixer_round >= max_rounds:
            session["phase"] = "blocked"
            session["chain_enabled"] = False
            session["status"] = "max_fixer_rounds"
            save_session(session)
            return {
                "action": "stop",
                "reason": f"max Fixer rounds ({max_rounds}) for {session.get('contract_id')}",
                "prompt": "",
            }

        if phase == "validator_done":
            session["fixer_round"] = fixer_round + 1
            session["failed_rows"] = failed_rows
        session["phase"] = "fixer_pending"
        save_session(session)
        return {
            "action": "fixer",
            "reason": f"Fixer round {session['fixer_round']}",
            "prompt": fixer_prompt(session),
        }

    if phase == "validator_pending":
        save_session(session)
        return {"action": "validator", "reason": "continue validation", "prompt": validator_prompt(session)}

    return {"action": "stop", "reason": f"idle phase={phase} status={status}", "prompt": ""}


def write_next_md(session: dict | None, nxt: dict) -> None:
    lines = [
        "# Validation chain — next action",
        "",
        f"**Action:** `{nxt.get('action')}`",
        f"**Reason:** {nxt.get('reason', '')}",
        "",
    ]
    if nxt.get("prompt"):
        lines.extend(["## Agent: continue in this same turn", "", nxt["prompt"]])
    else:
        lines.append("Chain stopped. No further agent action unless user restarts.")
    if session:
        lines.extend(
            [
                "",
                "## Session snapshot",
                f"- contract: `{session.get('contract_id')}`",
                f"- phase: `{session.get('phase')}`",
                f"- fixer_round: {session.get('fixer_round')}",
            ]
        )
    NEXT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
