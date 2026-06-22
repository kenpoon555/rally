# Product review — coach-parent-dual · 2026-06-22 (play-discover addendum)

## Persona

**Role:** R4 dual · **Goal:** Play discover respects coach + parent context.  
**Contract:** [module-role-surfaces.md](../contracts/module-role-surfaces.md) · [module-coach-parent-navigation.md](../contracts/module-coach-parent-navigation.md)

**Prior:** [2026-06-22-review.md](./2026-06-22-review.md) (onboarding tier 3 — Profile + Today)

## Play discover — PASS

| Check | Result | Notes |
|-------|--------|-------|
| Classes segment visible for coach/parent | **Pass** | Marcus sees Games \| Players \| Classes |
| Classes subtitle | **Pass** | *"Browse classes near you"* |
| Sport filter on Classes | **Pass** | Strip filters class listings |
| Parent next-action card | **Pass** | *"Alex · Youth Basketball Clinic · Confirm"* on Classes |
| Coach Host CTA | **Pass** | + Host on Games/Classes |

## Friction

| P | Screen | Issue | Suggested change | Contract impact |
|---|--------|-------|------------------|-----------------|
| P2 | Play → Classes | Dual-role user sees **parent confirm** card inside discover — useful but easy to miss vs Today MY CLASSES | Link card to enrollment detail | `module-coach-parent-navigation` |
| P3 | Play | Three segments + sport strip — dense for dual-role power user | Acceptable tier 1 | — |

## Screenshots

| File | Notes |
|------|-------|
| `2026-06-22/02-play-classes-segment.png` | Classes + Alex confirm card |

## Recommended contract changes

- [ ] `module-role-surfaces`: Marcus path = Classes segment **shown** (regression row).
