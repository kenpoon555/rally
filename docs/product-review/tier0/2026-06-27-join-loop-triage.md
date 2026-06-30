# Tier 0 — Dogfood / build-truth triage · Join Loop + class-response

**Queue:** `tier0-join-loop` · **Date:** 2026-06-27 · **Build:** `fix/class-response-builder` (Metro hot-reload) on **Android `emulator-5554`** (iOS on stale-session onboarding — see note)
**Personas:** `dogfood-triager`, `state-matrix-skeptic` ([catalog I](../personas.md))
**Rubric:** [TIER-MODEL.md](../TIER-MODEL.md) Tier 0 — classify every observation as `makes-sense` / `necessary` / `bug` / `needs-more-detail` / `simplify`, then route. No consolidator; this doc **is** the routed worklist.

> Tier 0 is the router. The two defects below were found by **using the real build**, not by audit — the Validator had marked `class-response` green via code audit, which cannot feel a self-contradiction or a missing viewer-state.

---

## Triage table

| # | Observation (real build) | Bucket | Route | Status |
|---|--------------------------|--------|-------|--------|
| 1 | Discover card showed **"5 left"** (badge) next to **"9 spots left"** (urgency hook) — two contradicting numbers on one card | **bug** + **needs-more-detail** | builder fix (`GameListCard`) + contract rule (`module-game-card` "Derived counts — single source of truth") | ✅ **Fixed & verified** → now "5 left" + "Starts in 9h" |
| 2 | **Non-member** viewing a public game saw **"Open Game Room"** (member surface) *and* "Request to Join" | **bug** + **needs-more-detail** | builder fix (`ActivityDetailScreen` `isGameMember` gate) + contract (`flow-game-room` viewer-state × visible-actions matrix) | ✅ **Fixed & verified** → now "Request to Join" only |
| 3 | Detail screen: **"1 of 1 marked ready"** while **"WHO'S GOING 3"** and **3 green ready dots** are shown | **bug** | file builder ticket; clarify ready-count semantics in `flow-rally-session` | ⬜ Open (new) |
| 4 | Discover badge **"5 left"** vs detail **"7 spots open"** for the same game — different meaning (server min-to-start vs live open-to-capacity), both labeled "spots/left" | **needs-more-detail** + **simplify** | resolve under `module-game-card` "cross-surface difference must be state-explained" — define distinct labels | ⬜ Open (new) |
| 5 | Today header subtitle "**… · 4:50 PM**" vs Next Up card "**Wed · 5:00 PM**" — time mismatch | **needs-more-detail** | confirm single time source (`flow-today-home` / home subtitle) | ⬜ Open (new) |
| 6 | class-response **`TodayMyClassesCard`** not reachable on this player login (needs parent w/ enrollment) | (deferred) | re-run on `marcus@…` parent account; covered by class-response-round1 code audit meanwhile | ⏸ Deferred |
| 7 | Discover → detail pull-through; "Starts in 9h" hook; single clear non-member CTA | **makes-sense** + **necessary** | keep — no action | ✅ Keep |

---

## State-matrix-skeptic — game detail viewer states

Per the new [flow-game-room](../../contracts/flow-game-room.md) matrix:

| Viewer state | Expected | Live result |
|--------------|----------|-------------|
| **Not joined** | Request to Join only; no Open Game Room | ✅ Verified (screenshot 02) |
| Requested (pending) | neither member nor request CTA | code-audited (`isGameMember` gate) — live ⏸ |
| Approved joiner | Open Game Room; no Request to Join | code-audited — live ⏸ (needs member seed / 2nd acct) |
| Host | Open Game Room + host ops | code-audited — live ⏸ |
| Finalized / cancelled | per matrix | code-audited — live ⏸ |

Live verification of member states is deferred (single-login emulator; iOS blocked). Not a blocker — the fix gates all entry points on `isGameMember`.

---

## Routing summary

- **Fixed in this change (bugs):** #1, #2 — verified on Android.
- **Contract gaps closed (needs-more-detail):** `module-game-card` (single-source counts), `flow-game-room` (viewer-state matrix).
- **New tickets to file (builder):** #3 ready-count, #4 label semantics, #5 home time source.
- **Deferred:** #6 parent-account class card; live member-state verification.

## Evidence

- `screenshots/01-discover-card-fixed.png` — discover card: "5 left" + "Starts in 9h" (no contradiction)
- `screenshots/02-detail-nonmember-fixed.png` — non-member detail: "Request to Join" only (no Open Game Room)

## iOS note

iOS sim (`iPhone 17 Pro`) sat on a black/splash for the 8–12s bootstrap window then dropped to onboarding — stale Supabase session with an invalid refresh token (`AuthApiError: Invalid Refresh Token`), recovered by `clearStaleBootstrapSession`. Not a code regression; triage ran on Android. Re-sign-in clears it.
