# Validation readiness — coach / parent / student contracts

**Last updated:** 2026-06-15  
**Queues:** [validation-queues.json](../contracts/validation-queues.json)

## Can we test today?

| Queue | Runnable now? | Why |
|-------|---------------|-----|
| `gtm1-launch-gate` | ✅ Yes (device + sim) | Code shipped; contracts green in sim |
| `v1.1-coach-foundation` | ❌ No | Not built; flag off |
| `v1.2-parent-student-core` | ❌ No | P0 + lawyer; no schema |
| `v1.3-parent-pilot` | ✅ Yes (after v1.2 seed) | Parent enroll + coach roster groups |
| `v1.4-coach-ops` | ❌ No | Not built |

**Same validator loop** (`validation-loop-start.sh --queue NAME --builder`) applies once code exists.

---

## Per-contract readiness

| Contract | Spec quality | Demo setup | Screenshots list | Validator template | Sim-testable when built? |
|--------|--------------|------------|------------------|--------------------|---------------------------|
| `module-coach-parent-navigation` | ✅ Good | 🔲 Add seed for class listings | ✅ | ✅ | ✅ |
| `flow-age-gate-onboarding` | ✅ Good | ✅ | 🔲 | ✅ | ✅ |
| `module-student-profile` | ✅ Good | 🔲 needs seed parent + profiles | 🔲 | 🔲 partial | ✅ |
| `module-student-visibility` | ✅ Good | N/A (RLS audit) | 🔲 | 🔲 | Partial (SQL + spot check) |
| `flow-parent-guardian-consent` | ✅ Good | 🔲 | 🔲 | 🔲 | ✅ |
| `flow-student-class-enrollment` | ✅ Good | ✅ | ✅ | 🔲 | ✅ |
| `flow-coach-minor-class-roster` | ✅ Good | ✅ | ✅ | 🔲 | ✅ |
| `flow-coach-class-operations` | ✅ Good | 🔲 | partial | 🔲 | ✅ v1.4 |

**Legend:** ✅ ready for Validator · 🔲 gap to close before first validation run

---

## Gaps to close before first CPS validation sprint

1. **P0 + lawyer** on consent (blocks v1.2 queue)
2. **Seed script** — `supabase/scripts/seed_parent_student_validation.sql` (marcus + Alex/Mia + invites + roster groups)
3. **Screenshots + Validator report** on: `module-student-profile`, `flow-parent-guardian-consent`, `module-student-visibility`
4. **`classDiscover` preset** in `gameCardLayouts.ts` + sport filter wiring (v1.1)
5. **Feature flags** documented in env or constants for Validator (turn on in sim only)

---

## Recommended validation order (when building)

```bash
# v1.1 — after GTM 2 evidence
./.cursor/hooks/validation-loop-start.sh --queue v1.1-coach-foundation --builder

# v1.2 — after P0 + lawyer
./.cursor/hooks/validation-loop-start.sh --queue v1.2-parent-student-core --builder

# v1.3 — pilot
./.cursor/hooks/validation-loop-start.sh --queue v1.3-parent-pilot --builder

# v1.4
./.cursor/hooks/validation-loop-start.sh --queue v1.4-coach-ops --builder
```

---

## Verdict

**Contracts are good enough to start Builder** for v1.1 navigation shell and v1.2 age gate — spec + checklist + queues exist.

**Not ready to validate end-to-end** until: lawyer H*, seed data, and first PRs land. Flow to test **is defined**; implementation and proof artifacts are the missing pieces.
