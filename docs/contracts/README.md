# Screen & flow contracts

Written pass/fail targets for agent validation loops. See [advisoragent.md](../../../advisoragent.md) for the workflow (Builder → Validator → Fixer).

**Do not contract every modal yet.** Start with flows that block friend testing.

## Active contracts (priority)

| Contract | Loop | North-star step |
|----------|------|-----------------|
| [flow-invite-to-rally.md](./flow-invite-to-rally.md) | **A** | Friend taps link → installs → signs in → lands in Rally |
| [flow-rally-session.md](./flow-rally-session.md) | **B** | Sees game → I'm in → host locks roster |
| [module-game-card.md](./module-game-card.md) | **Module** | Config-driven presets; no duplicated session actions |
| [module-invite-link.md](./module-invite-link.md) | **Module** | Host vs public URLs; landing + deep link routing |
| [module-sport-icon.md](./module-sport-icon.md) | **Module** | Today plain vs Rally ring; named surfaces |

## Sprint prep (draft contracts + rules)

Not in validation loops yet — scaffolds for next sprint. Each has a matching `.cursor/rules/rally-*.mdc` rule.

| Contract | Rule | Focus |
|----------|------|-------|
| [flow-game-room.md](./flow-game-room.md) | `rally-game-room.mdc` | Game chat + roster actions |
| [flow-create-game.md](./flow-create-game.md) | `rally-create-game.mdc` | Create activity + host share |
| [flow-play-screen.md](./flow-play-screen.md) | `rally-play-screen.mdc` | Discover / Today cards |
| [flow-inbox.md](./flow-inbox.md) | `rally-inbox.mdc` | Chats tab filters + navigation |
| [flow-profile.md](./flow-profile.md) | `rally-profile.mdc` | Profile + player modal |
| [flow-auth-onboarding.md](./flow-auth-onboarding.md) | `rally-auth-onboarding.mdc` | Auth, pending deep links, coach marks |

Loop A/B also have dedicated rules: `rally-flow-invite.mdc`, `rally-flow-rally-session.mdc`.

## How to validate

**Workflow (copy-paste prompts):** [.cursor/workflows/validate-contract.md](../../.cursor/workflows/validate-contract.md)

1. **Builder** — Read the contract. Fix only what fails the checklist. Do not change unrelated screens.
2. **Validator** — Run iOS simulator (and Android for keyboard items). Capture screenshots for each required state. Return a pass/fail table.
3. **Fixer** — Fix only failed rows from the validator report. No new behavior.

Open **three Cursor chats** (or run phases in order): Validator first on current build, then Fixer if needed, Builder only if the flow is missing.

### Stop conditions

- All checklist items pass, **or**
- Same failure repeats after **2–3** fix attempts → log blocker in the contract's **Open issues** section and stop the loop.

### Demo data (linked preview)

| Role | Account | Notes |
|------|---------|-------|
| Host | `marcus@rally-mvrhoops.demo` | Monrovia basketball Rally (`Julian Fisher Park Regulars`) |
| Member / tester | `@kunyu` (kenpoon4real) | Already member of demo Rally after seed |
| Seeds | `scripts/seed-monrovia-basketball-rally-demo.mjs` + `supabase/scripts/seed_monrovia_basketball_rally_demo.sql` | Run before Loop B if hub is empty |

### Testing without public App Store

Rally is on **TestFlight (internal)** and **Play internal testing** — not the public App Store. Loop A is still valid; only the **install** step changes.

| Tier | Who | Install | Invite link test |
|------|-----|---------|------------------|
| **1 — Simulator / dev** | You, agents | `npm run ios` / Metro | `xcrun simctl openurl booted "rallyapp://group-invite/…"` |
| **2 — Beta build** | Friends with TestFlight / Play invite | Tester installs from TestFlight or Play internal link first | Then tap `rallyapp://…` link (Messages, Notes, Safari) |
| **3 — Public store** | Everyone | App Store search | Same deep links + optional universal links (future) |

**What Loop A validates without App Store:** auth, deep link routing, invite accept, Rally join — once the app binary is on the device (sim or beta).

**What Loop A does not require:** public listing, App Store SEO, or “tap link → auto-install from store” (that needs universal links + live store page).

**Friend beta playbook (two steps):** (1) Send TestFlight or Play internal invite → friend installs Rally. (2) Send Rally invite link (`group-invite` URL or in-app friend invite). Friend opens link → app handles join.

See [beta-testflight-play-internal.md](../beta-testflight-play-internal.md).

**Manual step-by-step:** [MANUAL-RUN-loop-a.md](./MANUAL-RUN-loop-a.md)

### Deep link schemes

| URL pattern | Purpose |
|-------------|---------|
| `…/functions/v1/game-invite?activity={id}` | **Public game** — HTTPS landing → game card → request |
| `…/functions/v1/game-invite?token={token}&host=1` | **Host game** — HTTPS landing → auto-join |
| `…/functions/v1/rally-invite?token={token}` | **Rally group** — HTTPS landing → group join |
| `rallyapp://group-invite/{token}` | Join Rally (direct scheme) |
| `rallyapp://host-invite/{token}` | Host game invite (auto-join) |
| `rallyapp://game/{activityId}` | Open game detail (request flow) |
| `rallyapp://invite/{token}` | Legacy view-only invite |
| `rallyapp://auth/callback?...` | Magic link / OAuth return |

Build game URLs via `src/services/inviteLinkService.ts`. Rally scheme URLs via `buildRallyGroupInviteUrl()` in the same module.

### Screenshot output

Save under `docs/contracts/screenshots/{contract-id}/` with names from each contract's **Screenshots required** section. Git-ignore large PNG dumps if needed; keep filenames stable for diff review.

## Contract template

Copy for future screens (`play-screen.md`, `inbox.md`, etc.):

```markdown
# [Name] contract

**Contract id:** `kebab-name`
**Screens:** list routes / components
**Last validated:** YYYY-MM-DD · build N · platform

## Purpose
One sentence.

## Demo setup
How to reach each state (account, seed, navigation).

## Required states

| State | How to reach | Must show |
|-------|--------------|-----------|
| ... | ... | ... |

## Pass/fail checklist
- [ ] No redbox / render error
- [ ] Loads in < 3s (cold start to interactive)
- [ ] ...

## Screenshots required
1. `state-name.png` — description

## Out of scope
- ...

## Open issues
| Date | Blocker | Owner |
|------|---------|-------|
```

## Related docs

- [QA_BETA_CREW_CHECKLIST.md](../QA_BETA_CREW_CHECKLIST.md) — broader manual QA
- [HANDOFF_PRODUCT_AND_ENGINEERING_2026-06-07.md](../HANDOFF_PRODUCT_AND_ENGINEERING_2026-06-07.md)
- [.cursor/skills/rally-mobile-ui/SKILL.md](../../.cursor/skills/rally-mobile-ui/SKILL.md) — mobile UI tokens

## Deferred contracts

Add after sprint prep contracts pass validation:

- *(moved to sprint prep table above)*

## Agent hooks (optional chaining)

See `.cursor/hooks/README.md` — `stop` / `subagentStop` hooks can return `followup_message` to trigger the next Validator pass automatically (`hooks.json.example`).
