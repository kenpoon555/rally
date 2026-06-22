# Pre-approve review — onboarding-picky · 2026-06-22

**Queue:** `onboarding-round2-picky` tier 2 · **Reviewer:** pre-approve-review (Layer 1.5)  
**Inputs:** 6 persona tier-2 reviews · consolidator pack · contract diffs applied · prior tier-1 synthesis

## Verdict

**approve_with_notes**

Human can approve synthesis + builder backlog + validation handoff. Contract file edits for tier-2 P0/P1 are **written** to `docs/contracts/` (B7/B8 rows). Proceed to contract PR on `docs/onboarding-picky-contracts-product-review`.

---

## Coverage (persona → synthesis)

| persona-id | P0/P1 themes | In synthesis? | In backlog? | Gap |
|------------|--------------|---------------|-------------|-----|
| `player-no-coach-tools` | Legal gate P0 silent failure | Yes (theme 1) | B7 | None |
| `coach-approved-manual` | Unlock pass; relaunch P2 | Yes (theme 5) | — (document) | None |
| `parent-first-child` | Legal P0; B2 pass; age_category carry | Yes (themes 1, 3) | B7, B1 | None — legal stop documented |
| `parent-via-class-invite` | Legal P0; invite pass; returnToInvite P2 | Yes (themes 1, 4) | B7, B5 | Coach name P3 — acceptable defer |
| `coach-first-class` | Create Class → pickup P1 | Yes (theme 2) | B8 | None |
| `teen-restricted-account` | H2 pass; legal P0 on fresh; Add Child detour P2 | Yes (themes 1, 6) | B7, B9 | None — B3/B4 regression guard noted |

**Coverage score:** 6/6 personas represented. All P0/P1 blockers trace to synthesis themes 1–2 and backlog B7–B8. No silent drops.

**Builder ↔ synthesis alignment:** B7 matches legal gate P0; B8 matches coach-first P1. B1/B5/B9 carry items labeled P1/P2. Orphan items: none material.

**Validation handoff:** Order starts `flow-auth-onboarding` for new P0 — correct. Teen H2 regression guard included.

---

## Contract PR risk

| File | Change | Risk | Recommendation |
|------|--------|------|----------------|
| `flow-auth-onboarding.md` | Legal gate P0 checklist + open issue B7 | **Low** | Rows applied — observable error/retry |
| `flow-create-game.md` | Coach class publish split from pickup | **Low** | Checklist rows applied — aligns with persona evidence |
| `flow-coach-onboarding-org.md` | Non-Marcus CLASSES I TEACH row + B8 open issue | **Low** | Compatible with B4 green rows |
| `flow-teen-account-onboarding.md` | Teen invite Add Child UX note | **Low** | Policy unchanged — UX polish only |
| `flow-parent-guardian-consent.md` | No change | **legal OK** | Lawyer gate stays hard stop |
| *(none)* | Scope creep | **none —** | All changes trace to tier-2 reviews |
| *(none)* | GTM timing | **parallel-safe** | B7/B8 parallel to CPS onboarding |
| *(none)* | Infra cost | **$0** | No new infra |

**Conflict check:** Proposed diffs do not contradict green B2–B4 validation. They extend coverage to **fresh signup** and **non-Marcus coach class publish** — compatible, not breaking.

**Vague rows risk:** Builder backlog acceptance criteria are specific; contract checklist rows copy them for B7/B8.

---

## Concerns for human (read before approve)

1. **New P0 is upstream of all fresh personas.** B7 must land before re-running tier-2 fresh-signup validation.

2. **Coach-first remains Marcus-dependent until B8.** Validator must use `@playerr0474532` for coach class publish — not Marcus demo alone.

3. **H gates R1–R3** in synthesis use recommended defaults (alert+retry, separate class publish, hide teen Add Child CTA). Auto-pass applies defaults.

4. **Lawyer gate** still blocks E2E child create/enroll — tier-2 partial passes are expected.

5. **PR split:** (A) docs/contracts + consolidator → `dev`; (B) Builder B7/B8 on `fix/onboarding-picky-builder`; then validation.

---

## Human approve checklist

- [ ] I accept verdict: **approve_with_notes**
- [ ] I confirm R1: Legal gate error + retry → **A** recommended
- [ ] I confirm R2: Coach class separate publish → **A** recommended
- [ ] Contract PR includes written contract diffs (not synthesis-only)
- [ ] Ready for auto-pass / `./.cursor/hooks/product-review-loop-approve.sh`

---

## Next command after approve

```bash
cd RallyApp
./.cursor/hooks/product-review-loop-approve.sh
```
