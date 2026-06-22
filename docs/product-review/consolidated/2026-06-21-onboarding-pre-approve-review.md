# Pre-approve review — onboarding · 2026-06-21

**Queue:** `onboarding-round1` tier 1 · **Reviewer:** pre-approve-review (Layer 1.5)  
**Inputs:** 6 persona reviews · consolidator pack · contract stubs · `release-loops.json`

## Verdict

**approve_with_notes**

Human can approve **synthesis + builder backlog + validation handoff** with confidence. Do **not** merge a contract PR until the eight proposed contract edits are actually written to `docs/contracts/` (consolidator listed them but did not apply file diffs).

---

## Coverage (persona → synthesis)

| persona-id | P0/P1 themes | In synthesis? | In backlog? | Gap |
|------------|--------------|---------------|-------------|-----|
| `player-no-coach-tools` | R0 hiding pass; MY CLASSES parent copy P2 | Yes (theme 4) | B4 | None |
| `coach-approved-manual` | Before/after unlock pass; relaunch P2; MY CLASSES P2 | Yes (themes 4, 7) | B4, B7 | None |
| `parent-first-child` | Family hidden P0; `age_category` null P0; legal gate (expected) | Yes (themes 1, 2) | B1, B2 | None — legal stop documented |
| `parent-via-class-invite` | `age_category` P0; `returnToInvite` P1; invite path pass | Yes (themes 1, 5) | B1, B5 | Coach name on invite P3 — synthesis P2 only, acceptable defer |
| `coach-parent-dual` | Dual-role pass; Marcus hardcode P1 | Yes (theme 6) | B6 | None |
| `teen-restricted-account` | H2 coach leak P0; MY CLASSES on teen P1; teen default pass | Yes (themes 3, 4) | B3, B4 | Teen signup subtitle copy (P3) not in backlog — copy-only, OK defer |

**Coverage score:** 6/6 personas represented. All P0/P1 blockers trace to synthesis themes 1–5 and backlog B1–B6. No silent drops.

**Builder ↔ synthesis alignment:** P0 backlog (B1–B3) matches synthesis ranks 1–3. P1 backlog (B4–B6) matches ranks 4–6. Orphan items: none material.

**Validation handoff:** All P0 themes have a contract in handoff order. `flow-parent-guardian-consent` correctly listed as assert-explicit-blocker, not success path.

---

## Contract PR risk

| File | Change (as proposed in synthesis) | Risk | Recommendation |
|------|-----------------------------------|------|----------------|
| `flow-parent-family-onboarding.md` | Fail rows for Family visibility + `age_category` signup | **Not written yet** | Add checklist rows + update open issue; keep H1 default Yes |
| `flow-teen-account-onboarding.md` | H2 fail row + Today MY CLASSES hide for teens | **Not written yet** | Add observable Validator rows for H2 probe |
| `flow-student-class-enrollment.md` | `returnToInvite`, age prerequisite, invite-first note | **Not written yet** · status says "Implemented validated" | Downgrade status to partial for fresh-parent path; add rows |
| `flow-age-gate-onboarding.md` | Post-signup `age_category` DB assertion | **Not written yet** | Prefer this file over `flow-auth-onboarding` (pick one) |
| `flow-coach-onboarding-org.md` | Today MY CLASSES visibility for R0 | **Not written yet** | Observable: R0 Today has no parent copy |
| `flow-become-a-coach.md` | TestFlight reviewer script + cross-links | **Low** · stub already documents relaunch | Add script block only |
| `module-coach-parent-navigation.md` | Marcus reference note | **Low** | Cross-link teen gate; no conflict |
| `flow-parent-guardian-consent.md` | Documented tier-1 stop | **legal OK** | Do not remove lawyer gate |
| *(none)* | Scope creep | **creep** | None — all proposed changes trace to persona reviews |
| *(none)* | GTM 2 timing | **timing** | CPS onboarding fixes parallel-safe; not launch-week scope creep |
| *(none)* | Infra cost | **cost** | All Δ $0 — no new infra |

**Conflict check:** Proposed diffs do not contradict green validation on Marcus-seeded enroll path. They extend coverage to **fresh accounts** — compatible, not breaking.

**Vague rows risk:** Synthesis proposes good acceptance criteria in builder backlog; contract checklist rows must copy those verbatim when written (especially B4 “parent intent” rule).

---

## Concerns for human (read before approve)

1. **Contract PR is synthesis-only today.** `git diff docs/contracts/` shows no onboarding contract edits from this round. Approving means green-lighting the *plan*; Layer 2 still needs consolidator or `write-contract` skill to apply the eight files before merge.

2. **H gate numbering collision.** Synthesis H1–H4 (Family visibility, invite-first vs Profile, teen coach, approve gate) differ from contract-native H gates (e.g. `flow-parent-family-onboarding` H2 = hide-until-first-child). When editing contracts, rename synthesis gates to **R1–R4** or merge into contract H tables to avoid reviewer confusion.

3. **Validation order:** Use [validation-handoff](./2026-06-21-onboarding-validation-handoff.md) order (`flow-age-gate-onboarding` first), not the shorter list in synthesis § Validation handoff.

4. **`flow-student-class-enrollment` status mismatch.** Contract header says "Implemented — validated 2026-06-17" but fresh-parent invite path fails on `age_category` and `returnToInvite`. Contract PR should reflect **partial** until B1/B5 land.

5. **Lawyer gate stays a hard stop.** Tier-1 Validator green for parent flows means **reach consent screen**, not full child create/enroll. Confirm TestFlight notes mention this so reviewers do not file false regressions.

6. **Recommended PR split:** (A) `docs/contracts/` + consolidator docs → `dev`; (B) Builder `src/` B1–B6 → `dev`; then validation. Avoid one PR mixing docs + code.

---

## Suggested additions (optional)

- **Contract row** (`flow-parent-family-onboarding`): After 18+ signup, DB `profiles.age_category = 'adult_18_plus'` before Add Child (copy from B1 acceptance).
- **Contract row** (`flow-teen-account-onboarding`): Validator H2 probe — set `is_coach=true` on teen in DB, relaunch, assert zero Coach Tools + zero CLASSES I TEACH.
- **Contract row** (`flow-student-class-enrollment`): Inline add from invite with `returnToInvite` param returns to picker after create (post-consent).
- **H gate (release):** Record human choice on synthesis H1 (Profile Family when flag on + zero children) — default **A: Yes** aligns with contract H1 default; confirm before Builder B2.

---

## Human approve checklist

- [ ] I accept verdict: **approve_with_notes** (synthesis/backlog yes; contract file edits still required)
- [ ] I confirm H1: Show Profile Family when parent flags on + zero children → **A (Yes)** recommended
- [ ] I confirm H3: Teen erroneous `is_coach` → **A (force-hide)** recommended
- [ ] Contract PR scope: eight files per synthesis, written before merge — not merge synthesis markdown alone
- [ ] I understand guardian lawyer gate blocks E2E enroll until legal clears
- [ ] Ready to run: `./.cursor/hooks/product-review-loop-approve.sh` then contract PR + Builder B1–B6

---

## Next command after human approve

```bash
cd RallyApp
./.cursor/hooks/product-review-loop-approve.sh
```

Then: apply contract diffs → Builder B1–B6 → `./.cursor/hooks/validation-loop-start.sh --queue cps-onboarding --builder`
