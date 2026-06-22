# Pre-approve review — onboarding-expert · 2026-06-22

**Queue:** `onboarding-round3-expert` tier 3 · **Reviewer:** pre-approve-review (Layer 1.5)  
**Inputs:** 4 persona tier-3 reviews · consolidator pack · contract diffs applied · tier-2 synthesis

## Verdict

**approve_ready**

Human can approve synthesis. **No builder backlog** — contract PR is docs-only; validation is regression on `dev`.

---

## Coverage (persona → synthesis)

| persona-id | P0/P1 themes | In synthesis? | In backlog? | Gap |
|------------|--------------|---------------|-------------|-----|
| `coach-parent-dual` | Dual-role pass; Marcus seed P2 | Yes (theme 2) | — (validation V2) | None |
| `academy-head-coach` | v1 boundary pass; v2 gaps | Yes (theme 5) | — (validation V3) | None |
| `coach-first-class` | B8 pass; sim proof P2 | Yes (theme 1) | — (validation V1) | None |
| `parent-via-class-invite` | Lawyer gate; returnToInvite carry | Yes (theme 3) | — | None — legal stop documented |

**Coverage score:** 4/4 personas represented. No silent drops.

**Builder ↔ synthesis alignment:** Empty P0/P1 backlog matches synthesis executive summary. P2 items correctly in validation handoff only.

**Validation handoff:** Starts `module-coach-parent-navigation` for dual-role regression — correct for tier 3 focus.

---

## Contract PR risk

| File | Change | Risk | Recommendation |
|------|--------|------|----------------|
| `flow-create-game.md` | B8 open issue resolved; tier 3 proof row | **Low** | Aligns with PR #47 merge |
| `module-coach-parent-navigation.md` | Tier 3 regression note | **Low** | Compatible with green rows |
| `flow-organization-coaches.md` | v1 boundary checked | **Low** | Boundary-only — no creep |
| `flow-student-class-enrollment.md` | Lawyer re-run note | **legal OK** | No policy change |
| *(none)* | Scope creep | **none —** | Docs-only tier 3 |
| *(none)* | GTM timing | **parallel-safe** | No src in this round |
| *(none)* | Infra cost | **$0** | No new infra |

**Conflict check:** Proposed diffs do not contradict tier 2 green validation. They document regression expectations only.

---

## Concerns for human (read before approve)

1. **No builder branch** — tier 3 closes with validation regression on `dev` unless scope added.

2. **B8 sim screenshot** still outstanding — validation V1 row, not a ship blocker.

3. **Lawyer gate** unchanged — do not fail enroll E2E.

---

## Human approve checklist

- [ ] I accept verdict: **approve_ready**
- [ ] I confirm H1: skip builder when backlog empty → **A** recommended
- [ ] Contract PR is docs-only on `docs/onboarding-expert-contracts-product-review`
- [ ] Ready for auto-pass / `./.cursor/hooks/product-review-loop-approve.sh`

---

## Next command after approve

```bash
cd RallyApp
./.cursor/hooks/product-review-loop-approve.sh
```
