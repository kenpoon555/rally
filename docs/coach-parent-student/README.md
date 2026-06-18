# Coach · parent · student track

**Status:** Design discovery — **separate release track** from adult friend-group beta  
**Not legal advice** — lawyer review required before kid-class launch  
**Active adult beta:** [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md)

## Start here

| Doc | Purpose |
|-----|---------|
| [parent-student-coach-ui-ideas.md](./parent-student-coach-ui-ideas.md) | **UI concept** — Profile sections, tab map |
| [parent-student-coach-safety-design.md](./parent-student-coach-safety-design.md) | Safety model |
| [implementation-plan.md](./implementation-plan.md) | P0–P3 checklist + contract build order |
| [release-track.md](./release-track.md) | v1.0 → v2.0 scope by release |
| [validation-readiness.md](./validation-readiness.md) | Per-contract: ready to validate? |
| [ui-roadmap-compact.md](./ui-roadmap-compact.md) | Compact Profile UI · sport-filtered Classes |

## Contract index (draft — no Builder until gates pass)

| Contract id | Layer | Build when |
|-------------|-------|------------|
| [flow-age-gate-onboarding.md](../contracts/flow-age-gate-onboarding.md) | Onboarding | v1.2 prototype — after P0 legal decisions |
| [module-student-profile.md](../contracts/module-student-profile.md) | Data model | v1.2 |
| [flow-parent-guardian-consent.md](../contracts/flow-parent-guardian-consent.md) | Legal/consent | v1.2 — **lawyer sign-off H*** |
| [module-student-visibility.md](../contracts/module-student-visibility.md) | Privacy rules | v1.2 — referenced by all minor flows |
| [flow-student-class-enrollment.md](../contracts/flow-student-class-enrollment.md) | Enrollment | v1.3 pilot |
| [flow-coach-minor-class-roster.md](../contracts/flow-coach-minor-class-roster.md) | Coach roster | v1.3 pilot |
| [flow-coach-class-operations.md](../contracts/flow-coach-class-operations.md) | Cancel/defer/reassign | v1.4 Coach Pro beta |
| [module-coach-parent-navigation.md](../contracts/module-coach-parent-navigation.md) | **Tab map + Profile sections** | v1.1–v1.2 |

## Rule

**Do not mix this track into GTM 1–2 friend-group launch.** No student-profile Builder work until:

1. Adult beta launch gate passes ([launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md))
2. P0 decisions in [implementation-plan.md](./implementation-plan.md) are checked
3. Lawyer review on COPPA / minors (H* gate on consent contract)
