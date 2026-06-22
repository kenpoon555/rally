#!/usr/bin/env python3
"""Single-pane loop status for product-review + validation orchestration."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATUS_PATH = ROOT / "docs" / "LOOP-STATUS.md"
PR_SESSION = ROOT / "docs" / "product-review" / ".product-review-session.json"
VAL_SESSION = ROOT / "docs" / "contracts" / ".validation-session.json"
RELEASE_LOOPS = ROOT / "docs" / "release-loops.json"


def _load(path: Path) -> dict | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def _release_loop_label(pr: dict | None, val: dict | None) -> str:
    cfg = _load(RELEASE_LOOPS)
    if not cfg:
        return ""
    vq = (val or {}).get("queue_name") or (pr or {}).get("validation_queue")
    pq = (pr or {}).get("queue_name")
    for name, loop in cfg.items():
        if loop.get("validation_queue") == vq or loop.get("product_review_queue") == pq:
            return name
        for step in loop.get("steps") or []:
            q = step.get("queue")
            if q and q in (vq, pq):
                return name
    return ""


def _is_agent_sim_prep(val: dict | None) -> bool:
    if not val:
        return False
    try:
        from validation_chain_lib import is_agent_sim_prep_only, normalize_failed_rows
    except ImportError:
        import importlib.util

        lib_path = Path(__file__).resolve().parent / "validation-chain-lib.py"
        spec = importlib.util.spec_from_file_location("validation_chain_lib", lib_path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        is_agent_sim_prep_only = mod.is_agent_sim_prep_only
        normalize_failed_rows = mod.normalize_failed_rows
    rows = normalize_failed_rows(val)
    return is_agent_sim_prep_only(rows, val.get("notes") or "")


def _session_idle(session: dict | None, stale_seconds: int = 120) -> bool:
    if not session:
        return True
    raw = session.get("updated_at") or ""
    if not raw:
        return True
    try:
        ts = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return True
    age = (datetime.now(timezone.utc) - ts.astimezone(timezone.utc)).total_seconds()
    return age > stale_seconds


def _headline(pr: dict | None, val: dict | None, nxt_action: str, nxt_reason: str) -> tuple[str, str]:
    """Return (emoji+title, detail)."""
    reason = nxt_reason or ""

    if "VALIDATION_GREEN_ALL" in reason:
        return (
            "✅ PHASE COMPLETE — validation queue green",
            "Run `./.cursor/hooks/product-review-loop-validation-green.sh` then mark/merge src PR.",
        )

    if pr and pr.get("phase") == "done":
        return (
            "✅ LOOP COMPLETE — round finished",
            f"Queue `{pr.get('queue_name')}` is done. See ROUND-LOG.md or start the next queue.",
        )

    if pr and pr.get("phase") == "src_pr_merged":
        return (
            "✅ PHASE COMPLETE — src PR merged",
            "Round code is on dev. Start next tier/queue or close the orchestrator loop.",
        )

    if pr and pr.get("phase") == "validation_green":
        return (
            "✅ PHASE COMPLETE — local validation green",
            "Open/mark src PR for merge, then run `product-review-loop-src-pr-merged.sh` after merge.",
        )

    if "awaiting_human" in reason or (pr and pr.get("status") == "awaiting_human"):
        return (
            "👤 WAITING ON YOU — approve pre-review",
            "Run `./.cursor/hooks/product-review-loop-approve.sh` in this chat (or terminal).",
        )

    if val and val.get("status") == "partial":
        if nxt_action == "sim_prep" or val.get("phase") in ("sim_prep_pending", "sim_prep_done"):
            return (
                "🔄 IN PROGRESS — agent sim prep (sign out / signup / re-seed)",
                "Chain continues — agent runs sim/CLI steps; no human sign-out needed.",
            )
        if _is_agent_sim_prep(val) and val.get("chain_enabled"):
            return (
                "🔄 IN PROGRESS — sim prep queued",
                "Agent will sign out / fresh signup / SQL verify automatically.",
            )
        if _is_agent_sim_prep(val):
            return (
                "▶️ READY — say **continue** to resume sim prep",
                "Agent can run sign-out and signup on sim — you do not need to do it manually.",
            )
        return (
            "⏸️ PAUSED — product/human gate",
            "True partial (legal/H gate/not built) — update contract or decide, then continue.",
        )

    if val and val.get("phase") == "blocked" or val and val.get("status") in (
        "needs_human",
        "max_fixer_rounds",
    ):
        return (
            "⏸️ PAUSED — validation blocked",
            "Read failed_rows in validation session; fix or say **continue** to retry.",
        )

    if nxt_action == "stop" and "CHAIN_PAUSED" in reason:
        return ("⏸️ PAUSED — chain stopped", reason)

    if nxt_action in ("fixer", "validator", "builder", "sim_prep"):
        cid = (val or {}).get("contract_id", "")
        return (
            f"🔄 ACTIVE — agent running ({nxt_action})",
            f"Contract `{cid}` — hook should auto-continue when this turn ends.",
        )

    if val and val.get("chain_enabled") and val.get("phase") not in ("done", "blocked"):
        cid = val.get("contract_id", "")
        if _session_idle(val):
            return (
                f"▶️ QUEUED — contract `{cid}` ({int(val.get('queue_index', 0)) + 1}/{len(val.get('queue') or [])})",
                "No agent running. Say **continue** OR use one Agent chat with **stop hook** enabled (Settings → Hooks).",
            )
        return (
            f"🔄 ACTIVE — validation chain",
            f"Contract `{cid}` — agent should be working.",
        )

    if pr and pr.get("phase") == "validation_spawned":
        q = pr.get("validation_queue", "cps-onboarding")
        if val:
            idx = int(val.get("queue_index", 0))
            total = len(val.get("queue") or [])
            cid = val.get("contract_id", "")
            st = val.get("status", "")
            if _session_idle(val):
                return (
                    f"▶️ QUEUED — Layer 3 validation ({idx + 1}/{total})",
                    f"Contract `{cid}` · status `{st}`. Say **continue** or enable stop hook.",
                )
            return (
                f"🔄 ACTIVE — Layer 3 validation ({idx + 1}/{total})",
                f"Contract `{cid}` · status `{st}`.",
            )
        return (
            f"▶️ READY — start validation queue `{q}`",
            f"Run validation-loop-start.sh or say **continue** in orchestrator chat.",
        )

    if pr and pr.get("phase") in ("contract_pr_open", "src_pr_open"):
        which = "contract" if pr.get("phase") == "contract_pr_open" else "src"
        return (
            f"👤 WAITING ON YOU — merge {which} PR",
            f"Merge PR then run the matching `product-review-loop-*-merged.sh` hook.",
        )

    if nxt_action != "stop":
        return (
            f"🔄 IN PROGRESS — next: {nxt_action}",
            reason or "Agent should run chain-next and continue.",
        )

    return (
        "💤 IDLE — no active self-chain",
        "Say **continue** in orchestrator chat or run `./.cursor/hooks/rally-loop-status.sh`.",
    )


def _validation_progress(val: dict | None) -> str:
    if not val:
        return "_No validation session_"
    queue = val.get("queue") or []
    idx = int(val.get("queue_index", 0))
    total = len(queue)
    cid = val.get("contract_id", "—")
    lines = [
        f"- queue: `{val.get('queue_name', '—')}`",
        f"- contract: `{cid}` ({idx + 1}/{total})",
        f"- phase: `{val.get('phase')}` · status: `{val.get('status')}`",
        f"- chain_enabled: {val.get('chain_enabled', False)}",
    ]
    if val.get("builder_branch"):
        lines.append(f"- branch: `{val['builder_branch']}`")
    if val.get("notes"):
        lines.append(f"- notes: {val['notes']}")
    failed = val.get("failed_rows") or []
    if failed:
        lines.append("- failed_rows:")
        for row in failed[:5]:
            lines.append(f"  - {row}")
        if len(failed) > 5:
            lines.append(f"  - … +{len(failed) - 5} more")
    return "\n".join(lines)


def _product_review_progress(pr: dict | None) -> str:
    if not pr:
        return "_No product-review session_"
    completed = pr.get("reviews_completed") or []
    min_r = pr.get("min_reviews_before_consolidate")
    lines = [
        f"- queue: `{pr.get('queue_name', '—')}` tier {pr.get('tier', '—')}",
        f"- phase: `{pr.get('phase')}` · status: `{pr.get('status')}`",
        f"- layer_2: `{pr.get('layer_2_status', 'n/a')}`",
    ]
    if min_r:
        lines.append(f"- personas: {len(completed)}/{min_r}")
    if pr.get("builder_branch"):
        lines.append(f"- builder branch: `{pr['builder_branch']}`")
    if pr.get("layer_2_builder_pr"):
        lines.append(f"- src PR: {pr['layer_2_builder_pr']}")
    return "\n".join(lines)


def build_status(nxt_action: str = "", nxt_reason: str = "") -> str:
    pr = _load(PR_SESSION)
    val = _load(VAL_SESSION)
    title, detail = _headline(pr, val, nxt_action, nxt_reason)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    release = _release_loop_label(pr, val)

    lines = [
        "# Rally loop status",
        "",
        f"_Updated: {now}_",
        "",
    ]
    if release:
        lines.extend([f"**Release loop:** `{release}`", ""])
    lines.extend(
        [
            f"## {title}",
            "",
            detail,
            "",
            "_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._",
            "",
            "---",
            "",
            "## Product review",
            "",
            _product_review_progress(pr),
            "",
            "## Validation",
            "",
            _validation_progress(val),
            "",
            "---",
            "",
            "## Commands",
            "",
            "| Situation | Command |",
            "|-----------|---------|",
            "| Refresh this file | `./.cursor/hooks/rally-loop-status.sh` |",
            "| Continue in chat | Say **continue** (orchestrator reads this file) |",
            "| Approve pre-review | `./.cursor/hooks/product-review-loop-approve.sh` |",
            "| Validation all green | `./.cursor/hooks/product-review-loop-validation-green.sh` |",
            "| After src PR merge | `./.cursor/hooks/product-review-loop-src-pr-merged.sh` |",
            "",
            "Round history: `docs/product-review/ROUND-LOG.md`",
            "",
        ]
    )
    return "\n".join(lines)


def write_status(nxt_action: str = "", nxt_reason: str = "") -> Path:
    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATUS_PATH.write_text(build_status(nxt_action, nxt_reason), encoding="utf-8")
    return STATUS_PATH


def main() -> int:
    parser = argparse.ArgumentParser(description="Write or print unified loop status")
    parser.add_argument("--write", action="store_true", help="Write docs/LOOP-STATUS.md")
    parser.add_argument("--action", default="", help="Last chain-next action")
    parser.add_argument("--reason", default="", help="Last chain-next reason")
    args = parser.parse_args()

    if args.write:
        path = write_status(args.action, args.reason)
        print(path)
        return 0

    print(build_status(args.action, args.reason))
    return 0


if __name__ == "__main__":
    sys.exit(main())
