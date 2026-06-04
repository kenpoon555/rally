# Triage Defects Checklist (Step 7)

Last updated: 2026-02-27

Run this **after** completing validation steps 1–6 (auth/profile, Phase 3, Phase 4, Phase 6–8). The goal is to collect all known defects and prioritize them for fix order.

## Priority order (fix in this order)

1. **Data correctness** — Wrong or inconsistent data (e.g. counts, state, RLS leaks, finalization logic).
2. **Privacy** — Identity or PII exposed incorrectly; anonymous-until-confirmed violated.
3. **Crashes** — App or native crashes, unhandled exceptions that close the app.
4. **UX polish** — Copy, layout, loading states, non-blocking visual/flow issues.

## How to run triage

### 1. Gather defects

Collect every defect mentioned in:

- **Auth + profile:** `docs/archive/auth-profile-validation-checklist.md` (Results Logging / issues section; archived 2026-02-27).
- **Phase 3:** `docs/phase-3-validation-results.md` (Case Results notes, Platform Pass Matrix failures).
- **Phase 4:** `docs/phase-4-notifications-validation-checklist.md` (Issues section at bottom).
- **Phase 6–8:** `docs/phase-6-8-validation-results.md` (Phase 6/7/8 device validation notes and any “defects” subsections).
- **Release gate:** `docs/release-readiness-checklist.md` (any unchecked items that are due to bugs, not config).
- **Backlog:** `ROADMAP.md` → “Known Issues Backlog” and `RallyApp/issues/` (open issues only).

### 2. Classify each defect

For each defect, assign **one** bucket:

| Bucket              | Examples |
|---------------------|----------|
| Data correctness    | Wrong player count, join state out of sync, finalize writes wrong slot, RLS allows forbidden read |
| Privacy             | Identity visible before confirmation, PII in logs, wrong `can_view_profile_identity` result |
| Crashes             | Unhandled exception, native crash, app force-close |
| UX polish          | Misleading copy, missing loading state, layout glitch, non-blocking confusion |

### 3. Record in triage results

- Open **`docs/triage-results.md`**.
- List each defect under the correct priority section (Data correctness → Privacy → Crashes → UX).
- Within each section, order by severity (e.g. blocks release first).
- Add source (e.g. “Phase 3 Case 4”), platform (iOS/Android/both), and status (Open / In progress / Fixed).

### 4. Feed release gate

- Any **data correctness**, **privacy**, or **crashes** item that is Open and release-blocking should be reflected in `docs/release-readiness-checklist.md` (e.g. as a blocker note or unchecked dependency).
- Re-run triage after fixes; update `triage-results.md` and release-readiness as you go.

## Exit criteria

- [ ] All defects from steps 1–6 and Known Issues Backlog are listed in `triage-results.md`.
- [ ] Each defect has a priority bucket and a status.
- [ ] Release-blocking items are called out in `release-readiness-checklist.md`.

## Reference

- **Results doc:** `docs/triage-results.md`
- **Release gate:** `docs/release-readiness-checklist.md`
- **Project context:** `PROJECT_CONTEXT.md` § Immediate Next Steps / Validation Order (Step 7).
