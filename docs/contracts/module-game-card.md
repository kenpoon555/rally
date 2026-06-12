# Module contract — Game card

**Contract id:** `module-game-card`  
**Scope:** All game/activity card surfaces (list, session, detail)  
**Config:** `src/config/gameCardLayouts.ts`  
**Actions:** `src/hooks/useGameCardSessionActions.ts`, `src/components/rally/RallySessionCard.tsx`

## Purpose

One config-driven game card family. Screens pick a **preset** — they do not fork layout or join semantics inline.

## Presets (required)

| Preset key | Layout | Join mode | Share mode |
|------------|--------|-----------|------------|
| `discoverOpen` | listRow | none | none |
| `discoverLockedWelcoming` | listRow | none | none |
| `myGamesRow` | listRow | none | none |
| `homeNextUp` | homeNextUp | none | none |
| `rallySession` | sessionInline | instant | host |
| `detailPickup` | detailHero | request | host |
| `detailRally` | detailHero | instant | host |
| `mapTeaser` | mapTeaser | none | none |

## Rules for agents

1. **Add surfaces via presets** — extend `GAME_CARD_PRESETS`, do not add new `variant` flags on screens without updating this contract.
2. **Join semantics**
   - `request` → `JoinRequestButton` / host approval (public pickup)
   - `instant` → `joinCrewGame` / roster (Rally)
   - `none` → navigate to detail
3. **Share semantics** — use `shareModeForViewer(preset, { isHost })` + `shareGameInvite()`; never inline URL strings.
4. **Session actions** — use `createGameCardSessionActions` or `RallySessionCard`; do not duplicate join/I'm in/lock/nudge in panels.
5. **Shared subcomponents** — prefer `GameCardParticipantStack`, `RosterSeatBar`, `GameCardTypePill`, `GameCardWhoGoing`, `GameCardSection`.

## Pass/fail checklist

- [ ] New card surface references a preset from `gameCardLayouts.ts`
- [ ] No duplicated session action handlers outside `useGameCardSessionActions.ts`
- [ ] Rally vs pickup visible on detail (`GameCardTypePill`) and session (`sessionVariant: rally`)
- [ ] Unit tests in `__tests__/gameCardLayouts.test.ts` pass

## Out of scope

- Full `GameCardShell` refactor (list + detail unification) — future phase
- Game Room action bar (`GameRoomActionBar`) — separate contract later

## Related

- [module-invite-link.md](./module-invite-link.md)
- [flow-rally-session.md](./flow-rally-session.md)
- [.cursor/skills/rally-mobile-ui/SKILL.md](../../.cursor/skills/rally-mobile-ui/SKILL.md)
