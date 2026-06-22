# Builder backlog — 2026-06-22 · sport-meetup

**Source:** [2026-06-22-sport-meetup-synthesis.md](./2026-06-22-sport-meetup-synthesis.md)

---

## P0 — Meetup create path

### SM1 · Create without court for `locationStrictness: loose`

| Field | Value |
|-------|-------|
| **Contract** | `module-sport-meetup-sports` |
| **Symptom** | Running/Hiking use court picker; publish blocked without court row |
| **Likely files** | `CreateActivityScreen.tsx`, `locationService.ts`, `sports.ts` |
| **Acceptance** | Running create: meet area Places pin + publish; subtitle uses loose copy |

### SM2 · Enable Running in launch set (after SM1)

| Field | Value |
|-------|-------|
| **Contract** | `module-sport-meetup-sports` |
| **Acceptance** | `launchEnabled: true` for Running; appears in Play sport filter |

---

## P1 — Workout sport

### SM3 · Add `Workout` to `SportType` + metadata

| Field | Value |
|-------|-------|
| **Contract** | `module-sport-meetup-sports`, `module-sport-icon` |
| **Acceptance** | Workout create uses same meetup path; icon renders |

---

## P2 — Seeds (nice-to-have)

Optional LA meetup point seeds for Discover — not blocking SM1 proof.
