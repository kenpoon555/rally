#!/usr/bin/env python3
"""Product review queue state machine — persona → consolidator → validation handoff."""

from __future__ import annotations

import json
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

After you write `.product-review-session.json`, **do not stop** between steps until human gate.

1. Run: `python3 .cursor/hooks/product-review-chain-next.py`
2. Read `docs/product-review/.product-review-next.md`
3. Continue in THIS SAME TURN for: **persona** → **consolidator** → **pre_approve_reviewer**
4. **Stop only** when action is `stop` (awaiting_human after pre-approve review, blocked, or needs_revision)
5. After human approves (`product-review-loop-approve.sh`) → **spawn_validation** → validation sub-loop

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
5. Propose contract diffs in docs/contracts/ (human approves after pre-approve review)

Update session:
- phase: "consolidate_done"
- status: "consolidated"
- synthesis_path: path to synthesis file
- preserve chain_enabled, pre_approve_review_enabled

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

Update session:
- phase: "review_done"
- status: "awaiting_human" (if approve_ready/approve_with_notes) OR "needs_revision" / "blocked"
- pre_approve_verdict: your verdict
- pre_approve_review_path: path to review file

Run: python3 .cursor/hooks/product-review-chain-next.py
{self_chain_snippet(session)}

Do NOT edit src/. Do NOT run Validator.
"""


def _needs_pre_approve(session: dict) -> bool:
    if not session.get("pre_approve_review_enabled", True):
        return False
    if session.get("pre_approve_review_path"):
        return False
    return session.get("status") in ("consolidated", "awaiting_human", "running")


def spawn_validation_prompt(session: dict) -> str:
    vq = session.get("validation_queue", "baseline")
    tag = session.get("consolidator_tag", "onboarding")
    return f"""**Sub-loop spawn — Layer 3 validation** (approved handoff from product review)

Human approved queue `{session.get("queue_name")}`. Start the **validation sub-loop** now.

1. Read docs/product-review/consolidated/*-{tag}-builder-backlog.md (Builder items)
2. Read docs/product-review/consolidated/*-{tag}-validation-handoff.md (contract order)
3. Apply contract PR diffs if not merged yet (docs only unless user asked for src/)
4. Run:
   ```bash
   cd RallyApp
   ./.cursor/hooks/validation-loop-start.sh --queue {vq} --builder
   ```
5. **SELF-CHAIN validation** — complete Validator → Fixer → Validator in THIS SAME TURN per validation-chain-next.py (same pattern as gtm2 loop)

Do not re-run product review personas for this queue.
When validation queue green → optional next tier: see docs/release-loops.json `next_product_review_queue`.
"""


def human_gate_prompt(session: dict) -> str:
    path = session.get("pre_approve_review_path", "docs/product-review/consolidated/*-pre-approve-review.md")
    verdict = session.get("pre_approve_verdict", "unknown")
    return f"""**Human gate — ready for your approval**

Pre-approve verdict: **{verdict}**
Read: {path}
Also: synthesis, builder-backlog, validation-handoff in docs/product-review/consolidated/

When satisfied:
```bash
cd RallyApp
./.cursor/hooks/product-review-loop-approve.sh
```

Then spawn validation sub-loop (or ask Agent to run approve + validation self-chain).

If pre-approve said **revise_consolidator** — re-run consolidator, do not approve yet.
If **block** — resolve blockers in contract or roadmap first.
"""


def validation_handoff_prompt(session: dict) -> str:
    vq = session.get("validation_queue", "baseline")
    return f"""Product review queue **{session.get("queue_name")}** is approved.

**Layer 3 — start proof loop:**
```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue {vq} --builder
```

In Agent chat:
```
Run ./.cursor/hooks/validation-loop-start.sh --queue {vq} --builder and complete Validator this turn.
```

Builder items: see docs/product-review/consolidated/*-builder-backlog.md from consolidator.

**Next product-review round (optional):** after validation green, start tier {int(session.get("tier", 1)) + 1} queue if defined in review-queues.json.
"""


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
        # Advance to next persona not yet reviewed
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
            return {
                "action": "stop",
                "reason": "awaiting_human — read pre-approve review then approve",
                "prompt": human_gate_prompt(session),
            }
        if status in ("needs_revision", "blocked"):
            return {
                "action": "stop",
                "reason": f"pre-approve {status} — fix before human gate",
                "prompt": human_gate_prompt(session),
            }

    if phase == "consolidate_done" and session.get("status") == "awaiting_human":
        return {
            "action": "stop",
            "reason": "awaiting_human — approve synthesis before validation",
            "prompt": human_gate_prompt(session),
        }

    if phase == "approved" or (phase == "consolidate_done" and session.get("status") == "approved"):
        session["phase"] = "validation_spawned"
        session["status"] = "running"
        save_session(session)
        return {
            "action": "spawn_validation",
            "reason": "human approved — spawn validation sub-loop",
            "prompt": spawn_validation_prompt(session),
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

    if phase == "validation_spawned":
        return {"action": "stop", "reason": "validation sub-loop should be running", "prompt": spawn_validation_prompt(session)}

    return {"action": "stop", "reason": f"idle phase={phase}", "prompt": ""}


def write_next_md(session: dict | None, nxt: dict) -> None:
    lines = [
        "# Product review loop — next action",
        "",
        f"**Action:** `{nxt.get('action')}`",
        f"**Reason:** {nxt.get('reason', '')}",
        "",
    ]
    if nxt.get("prompt"):
        lines.extend(["## Agent / human: next step", "", nxt["prompt"]])
    if session:
        lines.extend(
            [
                "",
                "## Session",
                f"- queue: `{session.get('queue_name')}` tier {session.get('tier')}",
                f"- persona: `{session.get('current_persona_id')}`",
                f"- completed: {len(session.get('reviews_completed') or [])}/{session.get('min_reviews_before_consolidate')}",
            ]
        )
    NEXT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
