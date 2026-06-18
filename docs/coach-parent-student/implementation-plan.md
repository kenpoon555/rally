# Implementation plan — parent / student / coach safety

**Last updated:** 2026-06-15  
**Design:** [parent-student-coach-safety-design.md](./parent-student-coach-safety-design.md)  
**Releases:** [release-track.md](./release-track.md)

---

## Working model (summary)

```text
18+ adult Rally account
  → may create private reusable student profiles (parent-owned)
  → enrollment grants coach/academy scoped access only
  → under-13: no independent login in v1
  → 13–17: restricted teen account later
  → 18: student may claim account and unbind from parent (legal review)
```

---

## P0 — Decisions before any code (human gates)

| # | Decision | Owner | Blocks |
|---|----------|-------|--------|
| P0-1 | App minimum age + App Store / Play **target audience** declaration | Founder + lawyer | Store listing, age-gate copy |
| P0-2 | Under-13 policy: no independent login; parent-only | Product + lawyer | [flow-age-gate-onboarding.md](../contracts/flow-age-gate-onboarding.md) |
| P0-3 | 13–17 teen account policy (restricted, no child profiles, no payments) | Product | age-gate + teen contract (future) |
| P0-4 | 18+ claim/unbind flow for aging students | Product + lawyer | module-student-profile |
| P0-5 | Confirm **parent-owned reusable** student profiles (not class-owned) | Product | module-student-profile |
| P0-6 | Messaging: coach → **parent** for minors; no hidden adult–child DM | Product | visibility + chat rules |
| P0-7 | Photos/media in class context — in or out of v1.3 pilot? | Product + lawyer | enrollment contract |
| P0-8 | **Lawyer review** COPPA, parental consent, regional minors rules | Lawyer | [flow-parent-guardian-consent.md](../contracts/flow-parent-guardian-consent.md) |

**Exit criteria:** P0 checklist signed; H* gates resolved in consent contract.

---

## P1 — Design & contracts (current sprint — docs only)

| # | Deliverable | Status |
|---|-------------|--------|
| P1-1 | Safety design doc | ✅ |
| P1-2 | UI ideas doc | ✅ [parent-student-coach-ui-ideas.md](./parent-student-coach-ui-ideas.md) |
| P1-3 | Navigation contract (Profile sections) | ✅ |
| P1-4 | Draft contracts (8) | ✅ see [README](./README.md) |
| P1-5 | Data model sketch | ✅ module-student-profile |
| P1-6 | Update post-v1 roadmap + DOCS-INDEX | ✅ |
| P1-7 | Coach announcement flow spec | 🔲 Add to enrollment or separate contract v1.3 |
| P1-8 | Parent delete / export data flow | 🔲 Expand consent contract after lawyer |

**No Builder in P1.**

---

## P2 — Prototype (v1.2 — after P0 + lawyer)

Build order (one PR per contract after H* clear):

| Order | Contract | Implementation notes |
|-------|----------|----------------------|
| 0 | `module-coach-parent-navigation` | Feature flags; Play Classes segment UI shell (empty ok) |
| 1 | `flow-age-gate-onboarding` | Age range screen at signup; block under-13 self-signup |
| 2 | `module-student-profile` | Tables: `student_profiles`, parent link; no public fields |
| 3 | `module-student-visibility` | RLS + API: enforce no discover/search/public roster for minors |
| 4 | `flow-parent-guardian-consent` | Attestation UI + consent record + deletion path |
| 5 | `flow-student-class-enrollment` | Parent selects child → enrolls in coach class invite |
| 6 | `flow-coach-minor-class-roster` | Coach sees enrolled students only; read-only outside class |

**Prototype exit:** Parent creates profile → enrolls → coach sees roster → coach attendance → parent deletes profile (sim + 1 coach dry run).

---

## P3 — Pilot (v1.3 — real parents, not children alone)

| # | Item |
|---|------|
| P3-1 | 1–2 approved coaches (manual Founding Coach list) |
| P3-2 | Real parents enroll real students — founder on call |
| P3-3 | No public discovery for student profiles |
| P3-4 | No in-app payments |
| P3-5 | Coach announcements → parents only |
| P3-6 | Weekly pilot scorecard: fake profiles reported, parent confusion, coach time saved |
| P3-7 | Validator on all v1.3 contracts green before second coach |

---

## P4 — Coach Pro beta (v1.4)

| Contract | Features |
|----------|----------|
| `flow-coach-class-operations` | Cancel, defer, duplicate session, notify parents |
| Academy extensions | Substitute, consolidate — org model v2.0 |

---

## Abuse controls (implement with P2, not pricing-first)

| Control | Where |
|---------|--------|
| Adult gate (18+ to create student profile) | age-gate + student-profile |
| Guardian attestation checkbox | parent-guardian-consent |
| Free limit 3–5 student profiles per adult | student-profile module |
| Enrollment required for coach visibility | enrollment flow |
| Coach invite → parent enrolls child | enrollment flow |
| Audit log (create, enroll, access, attendance, announce) | Supabase audit table + contract |
| Report / delete / suspend | consent + admin tools |
| No public identity for minors | visibility module |

---

## Analytics (pilot only — no child PII)

| Event | When |
|-------|------|
| `student_profile_created` | Parent creates (no child name in event — use profile_id) |
| `student_enrolled` | Enrollment complete |
| `coach_minor_roster_viewed` | Coach opens class roster |
| `parent_consent_recorded` | Attestation saved |

Add to [module-analytics-events.md](../contracts/module-analytics-events.md) when implementing — **no PII**.

---

## What we are NOT building yet

- Teen 13–17 standalone account (contract stub only in design)
- Academy org model (v2.0)
- In-app payments for classes
- Public student profiles / Discover / Free Agent for minors
- Pricing as primary anti-abuse control
- Mixing student flows into GTM 1 friend-group beta

---

## Agent instructions

- **Layer 2:** Edit draft contracts only until P0 complete.
- **Layer 3:** No validation queue entry until v1.2 prototype branch exists.
- **Layer 1:** When interviewing coaches, use design doc + ask P0 questions.
