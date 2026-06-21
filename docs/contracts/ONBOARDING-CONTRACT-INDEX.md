# Onboarding contract index

**Last updated:** 2026-06-15  
**Use with:** [coach-parent-student/README.md](../coach-parent-student/README.md) · [product-review/personas.md](../product-review/personas.md)

Maps every **first-run and role-unlock** journey. Layer 3 validation uses these contracts; Layer 1 product review uses matching personas.

## Legend

| Status | Meaning |
|--------|---------|
| ✅ **Active** | Spec + partial/full implementation — validate with queue |
| 📝 **Stub** | Spec drafted — Builder after human approves stub |
| 📋 **Existing** | Spec exists — gaps noted in Open issues |
| 🔮 **v2** | Document only — do not Builder until release track says so |

---

## Adult pickup / Rally (GTM 1–2)

| Contract | Status | Journey |
|----------|--------|---------|
| [flow-auth-onboarding.md](./flow-auth-onboarding.md) | 📋 | Sign up, sign in, session restore, pending deep link replay |
| [flow-invite-to-rally.md](./flow-invite-to-rally.md) | ✅ | Invited link → auth → join Rally |
| [flow-age-gate-onboarding.md](./flow-age-gate-onboarding.md) | ✅ | Age category at signup (Under 13 / 13–17 / 18+) |
| [flow-profile.md](./flow-profile.md) | ✅ | Profile setup, settings — not role-specific |

**Product-review personas:** `basketball-first-timer`, `badminton-casual`, `*-host`, `multi-sport-power-host` — see [personas.md](../product-review/personas.md).

---

## Coach role unlock

| Contract | Status | Journey |
|----------|--------|---------|
| [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md) | 📋 | Who is a coach; solo vs academy; **hidden until `is_coach`** |
| [flow-become-a-coach.md](./flow-become-a-coach.md) | 📝 **NEW** | v1 manual approval → Coach Tools appear; v2 self-serve apply |
| [module-coach-parent-navigation.md](./module-coach-parent-navigation.md) | ✅ | Coach Tools section, Create Class entry |
| [flow-create-game.md](./flow-create-game.md) | ✅ | Coach class create (cross-ref sport modes) |
| [flow-coach-class-operations.md](./flow-coach-class-operations.md) | ✅ | After first class — defer / cancel / notify |

**Gap (Jun 2026):** No in-app “apply to coach” — v1 = founder sets `is_coach` in DB. Stub defines both paths.

**Product-review personas:** `player-no-coach-tools`, `coach-approved-manual`, `coach-first-class`, `coach-parent-dual`.

---

## Parent / student role unlock

| Contract | Status | Journey |
|----------|--------|---------|
| [flow-parent-family-onboarding.md](./flow-parent-family-onboarding.md) | 📝 **NEW** | 18+ parent → Family section → Add Child (no pre-seed) |
| [flow-parent-guardian-consent.md](./flow-parent-guardian-consent.md) | 📋 | Attestation before student profile (lawyer H* blocks today) |
| [module-student-profile.md](./module-student-profile.md) | ✅ | Create / list / archive child profiles |
| [flow-student-class-enrollment.md](./flow-student-class-enrollment.md) | ✅ | Coach invite → pick or create child → enroll |
| [flow-coach-minor-class-roster.md](./flow-coach-minor-class-roster.md) | ✅ | Coach sees enrolled minors only |
| [module-student-visibility.md](./module-student-visibility.md) | 📋 | Privacy / RLS — spot-check + SQL |

**Gap (Jun 2026):** Family section empty-state visibility vs contract; consent legal blocker.

**Product-review personas:** `parent-first-child`, `parent-via-class-invite`, `coach-parent-dual`.

---

## Teen account (13–17)

| Contract | Status | Journey |
|----------|--------|---------|
| [flow-age-gate-onboarding.md](./flow-age-gate-onboarding.md) | ✅ | Select 13–17 at signup |
| [flow-teen-account-onboarding.md](./flow-teen-account-onboarding.md) | 📝 **NEW** | Restricted teen account — no child profiles, no coach tools |

**Product-review persona:** `teen-restricted-account`.

---

## Organization / multi-coach (v2)

| Contract | Status | Journey |
|----------|--------|---------|
| [flow-organization-coaches.md](./flow-organization-coaches.md) | 🔮 **NEW** | Academy invites coaches; head coach reassigns class |
| [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md) | 📋 | v1 vs v2 decision gates (H2–H4) |

**Product-review persona:** `academy-head-coach` (v2 — document gaps only until built).

---

## Validation queues (Layer 3)

| Queue | Contracts | When |
|-------|-----------|------|
| `cps-onboarding` | become-a-coach, parent-family, age-gate, guardian-consent, coach-onboarding-org | After stub approval + flags on TestFlight |
| `v1.1-coach-foundation` | module-coach-parent-navigation | Coach UI shell |
| `v1.2-parent-student-core` | age-gate, student-profile, visibility, guardian-consent | After lawyer H* |
| `v1.3-parent-pilot` | student-class-enrollment, coach-minor-class-roster | Pilot with real parents |
| `gtm2-feedback-jun-2026` | push, create-game, coach clarity (partial CPS) | Current sprint |

See [validation-queues.json](./validation-queues.json).

---

## Product review batch (Layer 1)

**Pickup batch (existing):** 6 sport personas in [personas.md](../product-review/personas.md).

**Onboarding / role batch (new):** run after flags on or with documented blockers:

1. `player-no-coach-tools`
2. `coach-approved-manual`
3. `parent-first-child`
4. `parent-via-class-invite`
5. `coach-parent-dual`
6. `teen-restricted-account`

Then **consolidator** → approve contract diffs → Builder → `cps-onboarding` validation queue.

---

## What does *not* need a new contract

| Area | Use existing |
|------|----------------|
| Push permission on login | [flow-push-notifications-device.md](./flow-push-notifications-device.md) |
| Store reviewer demo login | [store-review-test-accounts.md](../store-review-test-accounts.md) |
| Founding Coach billing | Manual — [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md) GTM 3; contract when Stripe scoped |
