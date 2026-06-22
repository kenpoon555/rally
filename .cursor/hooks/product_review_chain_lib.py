#!/usr/bin/env python3
"""Product review queue state machine — persona → consolidator → contract PR → builder → validation."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SESSION_PATH = Path("docs/product-review/.product-review-session.json")
NEXT_PATH = Path("docs/product-review/.product-review-next.md")
QUEUES_PATH = Path("docs/product-review/review-queues.json")
PERSONAS_PATH = Path("docs/product-review/personas.md")
REVIEW_SKILL = ".cursor/skills/product-review/SKILL.md"
CONSOLIDATOR_SKILL = ".cursor/skills/product-review-consolidator/SKILL.md"
PRE_APPROVE_SKILL = ".cursor/skills/pre-approve-review/SKILL.md"

SELF_CHAIN = """
## SELF-CHAIN (when chain_enabled is true)

After you write `.product-review-session.json`, **do not stop** between steps until a gate fires.

1. Run: `python3 .cursor/hooks/product-review-chain-next.py`
2. Read `docs/product-review/.product-review-next.md`
3. Continue in THIS SAME TURN for: **persona** → **consolidator** → **pre_approve_reviewer**
4. **Auto-pass** (when eligible): pre-approve → approve → **spawn_contract_pr** — no human copy-paste
5. **Stop human only** when auto-pass blocked, `revise_consolidator`, `block`, or contract PR needs merge
6. After contract PR merges: `./.cursor/hooks/product-review-loop-contract-merged.sh` → **spawn_builder**
7. After builder B1–B6: `./.cursor/hooks/product-review-loop-builder-done.sh` → **spawn_validation**

Never say "start a new chat" when chain_enabled is true (except human-assign mode).
"""


def self_chain_snippet(session: dict) -> str:
    if session.get("chain_enabled"):
        return SELF_CHAIN
    return "\nTell the human the next persona or consolidator step.\n"


def load_queues() -> dict:
    return json.loads(QUEUES_PATH.read_text(encoding="utf-8"))


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


def tier_rubric(tier: int) -> str:
    if tier >= 3:
        return """
**Tier 3 (expert / picky):** Edge cases, error states, performance, accessibility. Any blocker = P0. Note regressions vs prior round.
"""
    if tier >= 2:
        return """
**Tier 2 (picky):** Complete the full journey without founder/DB help except where contract documents manual steps (e.g. is_coach flip). Silent failures = P0.
"""
    return """
**Tier 1 (discovery):** Note all friction P1–P3; journey may be partially blocked (legal gates OK to document).
"""


def _auto_pass_evaluate(session: dict) -> dict:
    from product_review_auto_pass import evaluate

    return evaluate(session)


def _try_auto_pass(session: dict) -> dict | None:
    """Return next action dict if auto-pass applies; else None."""
    if not session.get("auto_pass_enabled", True):
        return None
    result = _auto_pass_evaluate(session)
    if not result.get("eligible"):
        session["auto_pass_blocked"] = True
        session["auto_pass_stop_reasons"] = result.get("stop_reasons") or []
        save_session(session)
        return None
    from product_review_auto_pass import mark_approved

    mark_approved(session, auto_passed=True, evaluation=result)
    session["phase"] = "contract_pr_pending"
    save_session(session)
    return {
        "action": "spawn_contract_pr",
        "reason": f"auto-pass ({result.get('verdict')}) — contract PR next",
        "prompt": spawn_contract_pr_prompt(session),
    }


def persona_prompt(session: dict) -> str:
    pid = session["current_persona_id"]
    qname = session.get("queue_name", "")
    tier = int(session.get("tier", 1))
    idx = int(session.get("persona_index", 0))
    total = len(session.get("personas") or [])
    done = len(session.get("reviews_completed") or [])
    return f"""You are the Product Review agent for Rally (Layer 1 — UX feedback, NOT Validator).

Queue: {qname} · persona {idx + 1}/{total} · tier {tier} · completed {done}/{session.get("min_reviews_before_consolidate", total)}
{tier_rubric(tier)}
Persona id: **{pid}**

Read:
- RallyApp/docs/product-review/personas.md (find {pid} — contract + account hints)
- RallyApp/{REVIEW_SKILL}

Steps:
1. Metro + sim (or TestFlight if persona requires device)
2. Walk the journey as this persona — no code changes
3. Screenshots → docs/product-review/{pid}/YYYY-MM-DD/
4. Write docs/product-review/{pid}/YYYY-MM-DD-review.md (friction table + contract impact)

When finished, update RallyApp/docs/product-review/.product-review-session.json:
- append "{pid}" to reviews_completed (if not already)
- phase: "persona_done"
- status: "running"
- preserve queue_name, personas, persona_index, tier, validation_queue fields

Then run: python3 .cursor/hooks/product-review-chain-next.py
Read docs/product-review/.product-review-next.md and continue per next action.
{self_chain_snippet(session)}
Do NOT run Validator or edit src/.
"""


def consolidator_prompt(session: dict) -> str:
    tag = session.get("consolidator_tag", "")
    vq = session.get("validation_queue", "")
    tier = int(session.get("tier", 1))
    return f"""You are the Product Review Consolidator for Rally (Layer 1 → Layer 2).

Queue completed: **{session.get("queue_name")}** (tier {tier}, tag `{tag}`)
Reviews: {json.dumps(session.get("reviews_completed") or [])}

Read:
- RallyApp/{CONSOLIDATOR_SKILL}
- RallyApp/docs/product-review/personas.md
- All docs/product-review/**/*-review.md for personas in this queue

Steps:
1. Write docs/product-review/consolidated/YYYY-MM-DD-{tag}-synthesis.md
2. Include sections: Top pain themes · Recommended contract changes · Human H gates
3. Write docs/product-review/consolidated/YYYY-MM-DD-{tag}-builder-backlog.md
   - P0/P1 items → which contract file · suggested checklist row · no src/
4. Write docs/product-review/consolidated/YYYY-MM-DD-{tag}-validation-handoff.md
   - Ordered contract list for Layer 3
   - Command: ./.cursor/hooks/validation-loop-start.sh --queue {vq} --builder
5. Apply contract diffs to docs/contracts/ (commit on branch when done)

Update session:
- phase: "consolidate_done"
- status: "consolidated"
- synthesis_path: path to synthesis file
- preserve chain_enabled, pre_approve_review_enabled, auto_pass_enabled

Then run: python3 .cursor/hooks/product-review-chain-next.py
{self_chain_snippet(session)}
Do NOT ask human to approve yet — pre-approve reviewer runs next.
"""


def pre_approve_reviewer_prompt(session: dict) -> str:
    tag = session.get("consolidator_tag", "onboarding")
    qname = session.get("queue_name", "")
    synthesis = session.get("synthesis_path") or f"docs/product-review/consolidated/YYYY-MM-DD-{tag}-synthesis.md"
    return f"""You are the **Pre-approve Reviewer** for Rally (Layer 1.5 — before human gate).

Queue: **{qname}** · tag `{tag}`
Consolidator output: {synthesis}

Read:
- RallyApp/{PRE_APPROVE_SKILL}
- RallyApp/docs/product-review/consolidated/*-{tag}-*.md
- Source persona reviews for: {json.dumps(session.get("reviews_completed") or [])}
- Proposed contract diffs under docs/contracts/
- RallyApp/docs/launch-roadmap-jun-2026.md

Check:
1. **Coverage** — every persona P0/P1 theme reflected in synthesis + builder-backlog
2. **Contract PR risk** — breaking conflicts, vague rows, scope creep, missing H gates, lawyer/GTM issues
3. **Concerns** — what human must read before approving

Write: docs/product-review/consolidated/YYYY-MM-DD-{tag}-pre-approve-review.md
Verdict: approve_ready | approve_with_notes | revise_consolidator | block

In Contract PR risk table use Risk labels: **Low**, **Not written yet**, **legal OK**, **conflict**, **creep**, **timing**, **vague**, **block**

Update session:
- phase: "review_done"
- status: "awaiting_human" (if approve_ready/approve_with_notes) OR "needs_revision" / "blocked"
- pre_approve_verdict: your verdict
- pre_approve_review_path: path to review file

Run: python3 .cursor/hooks/product-review-chain-next.py
If auto-pass eligible, chain-next continues to **spawn_contract_pr** in THIS SAME TURN — do not stop for human.
{self_chain_snippet(session)}

Do NOT edit src/. Do NOT run Validator.
"""


def _needs_pre_approve(session: dict) -> bool:
    if not session.get("pre_approve_review_enabled", True):
        return False
    if session.get("pre_approve_review_path"):
        return False
    return session.get("status") in ("consolidated", "awaiting_human", "running")


def spawn_contract_pr_prompt(session: dict) -> str:
    tag = session.get("consolidator_tag", "onboarding")
    qname = session.get("queue_name", "")
    branch = session.get("contract_pr_branch") or f"docs/{tag}-contracts-product-review"
    auto = "yes" if session.get("auto_passed") else "no (human approved)"
    return f"""**Layer 2 — contract PR** (queue `{qname}`, auto-pass: {auto})

Human gate cleared. **Do not jump to validation yet.**

1. Verify docs/contracts/ edits match synthesis + pre-approve review
2. Commit on branch `{branch}` if uncommitted changes remain
3. Push and open/update PR to `dev`:
   ```bash
   cd RallyApp
   git push -u origin HEAD
   gh pr create --base dev --head $(git branch --show-current) --title "docs: {tag} Layer 2 contracts" || gh pr view --web
   ```
4. Update session:
   - `layer_2_pr`: PR URL
   - `layer_2_status`: "open"
   - `phase`: "contract_pr_open"
5. **Stop** — human merges PR, then run:
   ```bash
   ./.cursor/hooks/product-review-loop-contract-merged.sh
   ```

Consolidator pack: docs/product-review/consolidated/*-{tag}-*.md
Do not edit src/ in this step.
"""


def spawn_builder_prompt(session: dict) -> str:
    tag = session.get("consolidator_tag", "onboarding")
    vq = session.get("validation_queue", "baseline")
    branch = session.get("builder_branch") or f"fix/{tag}-builder"
    return f"""**Layer 2b — Builder (local branch — NO src PR yet)**

Contract PR is on `dev`. Implement on a **local feature branch** only.

1. Read docs/product-review/consolidated/*-{tag}-builder-backlog.md (B1–B6)
2. Branch from `dev`: e.g. `{branch}`
3. Implement in `src/` — **do not** open or merge a src PR yet
4. Smoke-test on sim (flags per validation-handoff)
5. When code is ready to prove, run:
   ```bash
   cd RallyApp
   ./.cursor/hooks/product-review-loop-builder-done.sh
   ```

That starts **local validation** (`validation-loop-start.sh --queue {vq}`).
**Src PR opens only after** `./.cursor/hooks/product-review-loop-validation-green.sh`.

Do not re-run product review personas.
"""


def spawn_validation_prompt(session: dict) -> str:
    vq = session.get("validation_queue", "baseline")
    tag = session.get("consolidator_tag", "onboarding")
    first = session.get("validation_first_contract") or "flow-age-gate-onboarding"
    return f"""**Layer 3 — validation (LOCAL — current git branch)**

Prove the **local builder branch** against merged contracts on `dev`. No src PR merge required.

1. Read docs/product-review/consolidated/*-{tag}-validation-handoff.md (contract order)
2. Confirm checkout is your builder branch (not necessarily merged to dev)
3. Run:
   ```bash
   cd RallyApp
   ./.cursor/hooks/validation-loop-start.sh --queue {vq} --from {first} --builder
   ```
4. **SELF-CHAIN** Validator → Fixer → Validator in THIS SAME TURN

When queue green:
```bash
./.cursor/hooks/product-review-loop-validation-green.sh
```

Then open/mark src PR — merge only after proof is recorded.
Do not re-run product review personas.
"""


def spawn_src_pr_prompt(session: dict) -> str:
    tag = session.get("consolidator_tag", "onboarding")
    pr = session.get("layer_2_builder_pr") or "(set after gh pr create)"
    return f"""**Layer 2c — src PR (after validation green)**

Validation passed locally. Now publish the **same branch** as a PR.

1. Attach validation summary to PR body (contract pass table, screenshot paths)
2. Mark PR ready for review (or merge if you are the gate):
   ```bash
   gh pr ready {pr}   # if draft
   ```
3. Update session: `layer_2_builder_status`: "open" · `phase`: "src_pr_open"
4. **Human merges** src PR to `dev` after review

PR: {pr}
"""


def human_gate_prompt(session: dict) -> str:
    path = session.get("pre_approve_review_path", "docs/product-review/consolidated/*-pre-approve-review.md")
    verdict = session.get("pre_approve_verdict", "unknown")
    stops = session.get("auto_pass_stop_reasons") or []
    stop_block = ""
    if stops:
        stop_block = "\n**Auto-pass blocked:**\n" + "\n".join(f"- {s}" for s in stops) + "\n"
    return f"""**Human gate — approval required**

Pre-approve verdict: **{verdict}**
Read: {path}
{stop_block}
When satisfied:
```bash
cd RallyApp
./.cursor/hooks/product-review-loop-approve.sh
```

Then chain-next → **spawn_contract_pr** (not validation).

If pre-approve said **revise_consolidator** — re-run consolidator, do not approve yet.
If **block** — resolve blockers in contract or roadmap first.
"""


def validation_handoff_prompt(session: dict) -> str:
    vq = session.get("validation_queue", "baseline")
    return spawn_validation_prompt(session)


def mark_manual_approved(session: dict) -> None:
    session["phase"] = "approved"
    session["status"] = "approved"
    session["auto_passed"] = False
    session["layer_2_status"] = "pending"
    save_session(session)


def compute_next(session: dict) -> dict:
    phase = session.get("phase", "")
    personas = session.get("personas") or []
    completed = list(session.get("reviews_completed") or [])
    min_reviews = int(session.get("min_reviews_before_consolidate", len(personas)))
    idx = int(session.get("persona_index", 0))

    if phase == "persona_done":
        cur = session.get("current_persona_id")
        if cur and cur not in completed:
            completed.append(cur)
            session["reviews_completed"] = completed
        remaining = [p for p in personas if p not in completed]
        if remaining and len(completed) < len(personas):
            nxt = remaining[0]
            session["persona_index"] = personas.index(nxt)
            session["current_persona_id"] = nxt
            session["phase"] = "persona_pending"
            save_session(session)
            return {
                "action": "persona",
                "reason": f"next persona {nxt} ({len(completed)}/{len(personas)} done)",
                "prompt": persona_prompt(session),
            }
        if len(completed) >= min_reviews:
            session["phase"] = "consolidate_pending"
            save_session(session)
            return {
                "action": "consolidator",
                "reason": f"{len(completed)} reviews — run consolidator",
                "prompt": consolidator_prompt(session),
            }
        return {
            "action": "stop",
            "reason": f"need {min_reviews} reviews, have {len(completed)}",
            "prompt": "",
        }

    if phase == "consolidate_done" and session.get("status") == "needs_revision":
        session["phase"] = "consolidate_pending"
        session["status"] = "running"
        session["pre_approve_verdict"] = None
        session["pre_approve_review_path"] = None
        save_session(session)
        return {
            "action": "consolidator",
            "reason": "pre-approve sent back — re-run consolidator",
            "prompt": consolidator_prompt(session),
        }

    if phase == "consolidate_done" and _needs_pre_approve(session):
        session["phase"] = "review_pending"
        session["status"] = "running"
        save_session(session)
        return {
            "action": "pre_approve_reviewer",
            "reason": "consolidator done — pre-approve review before human gate",
            "prompt": pre_approve_reviewer_prompt(session),
        }

    if phase == "consolidate_done" and not session.get("pre_approve_review_enabled", True):
        session["status"] = "awaiting_human"
        save_session(session)
        auto = _try_auto_pass(session)
        if auto:
            return auto
        return {
            "action": "stop",
            "reason": "awaiting_human (pre-approve disabled)",
            "prompt": human_gate_prompt(session),
        }

    if phase == "review_pending":
        return {
            "action": "pre_approve_reviewer",
            "reason": "pre-approve review before human gate",
            "prompt": pre_approve_reviewer_prompt(session),
        }

    if phase == "review_done":
        status = session.get("status", "")
        if status == "awaiting_human":
            auto = _try_auto_pass(session)
            if auto:
                return auto
            return {
                "action": "stop",
                "reason": "awaiting_human — auto-pass blocked, human approval required",
                "prompt": human_gate_prompt(session),
            }
        if status in ("needs_revision", "blocked"):
            return {
                "action": "stop",
                "reason": f"pre-approve {status} — fix before human gate",
                "prompt": human_gate_prompt(session),
            }

    if phase == "consolidate_done" and session.get("status") == "awaiting_human":
        auto = _try_auto_pass(session)
        if auto:
            return auto
        return {
            "action": "stop",
            "reason": "awaiting_human — approve synthesis before Layer 2",
            "prompt": human_gate_prompt(session),
        }

    if phase in ("approved", "contract_pr_pending"):
        session["phase"] = "contract_pr_pending"
        session["status"] = "running"
        save_session(session)
        return {
            "action": "spawn_contract_pr",
            "reason": "approved — Layer 2 contract PR",
            "prompt": spawn_contract_pr_prompt(session),
        }

    if phase == "contract_pr_open":
        pr = session.get("layer_2_pr") or "(PR URL in session)"
        return {
            "action": "stop",
            "reason": "contract PR open — merge then run product-review-loop-contract-merged.sh",
            "prompt": f"""**Waiting on Layer 2 contract PR merge**

PR: {pr}

After merge to `dev`:
```bash
cd RallyApp
./.cursor/hooks/product-review-loop-contract-merged.sh
```
""",
        }

    if phase == "contract_merged":
        session["phase"] = "builder_pending"
        session["status"] = "running"
        save_session(session)
        return {
            "action": "spawn_builder",
            "reason": "contract PR merged — Builder B1–B6",
            "prompt": spawn_builder_prompt(session),
        }

    if phase == "builder_pending":
        return {
            "action": "spawn_builder",
            "reason": "builder backlog ready",
            "prompt": spawn_builder_prompt(session),
        }

    if phase == "builder_done":
        session["phase"] = "validation_spawned"
        session["status"] = "running"
        session["layer_2_builder_status"] = "local_ready"
        save_session(session)
        return {
            "action": "spawn_validation",
            "reason": "builder local ready — validate before src PR",
            "prompt": spawn_validation_prompt(session),
        }

    if phase == "validation_spawned":
        return {
            "action": "spawn_validation",
            "reason": "validation sub-loop (local branch)",
            "prompt": spawn_validation_prompt(session),
        }

    if phase == "validation_green":
        session["phase"] = "src_pr_pending"
        session["status"] = "running"
        save_session(session)
        return {
            "action": "spawn_src_pr",
            "reason": "validation green — open src PR",
            "prompt": spawn_src_pr_prompt(session),
        }

    if phase in ("src_pr_pending", "src_pr_open"):
        pr = session.get("layer_2_builder_pr") or "(create with gh pr create)"
        return {
            "action": "stop",
            "reason": "src PR ready for human merge after local proof",
            "prompt": spawn_src_pr_prompt(session),
        }

    if phase == "src_pr_merged":
        session["phase"] = "done"
        session["status"] = "complete"
        save_session(session)
        return {
            "action": "stop",
            "reason": "onboarding round complete — optional tier 2 product review",
            "prompt": f"""**Round complete**

Optional next tier:
```bash
./.cursor/hooks/product-review-loop-start.sh --queue onboarding-round2-picky --chain
```
""",
        }

    if phase == "consolidate_pending":
        save_session(session)
        return {
            "action": "consolidator",
            "reason": "all personas done — consolidator",
            "prompt": consolidator_prompt(session),
        }

    if phase in ("started", "persona_pending"):
        if not session.get("current_persona_id") and personas:
            session["current_persona_id"] = personas[idx]
        session["phase"] = "persona_pending"
        save_session(session)
        return {
            "action": "persona",
            "reason": f"continue persona {session.get('current_persona_id')}",
            "prompt": persona_prompt(session),
        }

    if phase == "done":
        return {"action": "stop", "reason": "queue complete", "prompt": ""}

    return {"action": "stop", "reason": f"idle phase={phase}", "prompt": ""}


def write_next_md(session: dict | None, nxt: dict) -> None:
    lines = [
        "# Product review loop — next action",
        "",
        f"**Action:** `{nxt.get('action')}`",
        f"**Reason:** {nxt.get('reason', '')}",
        "",
    ]
    if session:
        if session.get("auto_passed"):
            lines.append(f"**Auto-pass:** yes — {session.get('auto_pass_reason', '')}")
            lines.append("")
        elif session.get("auto_pass_blocked"):
            lines.append("**Auto-pass:** blocked — human gate")
            lines.append("")
    if nxt.get("prompt"):
        lines.extend(["## Agent / human: next step", "", nxt["prompt"]])
    if session:
        lines.extend(
            [
                "",
                "## Session",
                f"- queue: `{session.get('queue_name')}` tier {session.get('tier')}",
                f"- phase: `{session.get('phase')}` · status: `{session.get('status')}`",
                f"- layer_2: `{session.get('layer_2_status', 'n/a')}`",
                f"- completed: {len(session.get('reviews_completed') or [])}/{session.get('min_reviews_before_consolidate')}",
            ]
        )
    NEXT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    try:
        from loop_status_lib import write_status

        write_status(nxt.get("action", ""), nxt.get("reason", ""))
    except ImportError:
        pass
