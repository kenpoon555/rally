# ADR-0003: Single typed navigation param list

- **Status:** proposed
- **Date:** 2026-06-28
- **Lens / source:** state-management-auditor
- **Severity:** P1
- **Deciders:** founder

## Context

E3 audit found 118 `as never` casts at `navigate()` call sites across `src/`. Root cause: `RootStackParamList` in `navigationRef.ts` covers only 6 of 22 registered routes, and 6 screen files each define their own partial local `*ParamList` type. Components navigating across stack boundaries must cast to `as never` because TypeScript cannot resolve the route name.

Three additional symptoms:
- `useNavigation<any>()` at 3 sites (`GameRoomActionBar`, `ProfileScreen`, `MyGamesScreen`)
- `NativeStackNavigationProp<any>` drilled as prop to `RallyChatPanel` and `RallyPlayPanel`
- `navigationRef.navigate()` uses `as any` (3 sites in `navigationRef.ts`)

Zero exhaustive-deps suppressions across 187 effects — the codebase is otherwise disciplined. The nav casts are the single concentrated type-safety gap.

## Decision

Create `src/navigation/types.ts` as the single source of truth for all navigation param lists. Augment React Navigation's `RootParamList` so all `navigate()` calls are type-checked without casts.

```ts
// src/navigation/types.ts
import type { NavigatorScreenParams } from '@react-navigation/native';
import { ROUTES } from '../constants/routes';

export type AuthStackParamList = {
  [ROUTES.AUTH.WELCOME]: undefined;
  [ROUTES.AUTH.AGE_GATE]: undefined;
  [ROUTES.AUTH.UNDER_13_BLOCKED]: undefined;
  [ROUTES.AUTH.LOGIN]: undefined;
  [ROUTES.AUTH.SIGNUP]: undefined;
};

export type MainTabParamList = {
  [ROUTES.HOME.DYNAMIC]: undefined;
  [ROUTES.HOME.MAIN]: undefined;
  [ROUTES.CHAT.TAB]: undefined;
  [ROUTES.PROFILE.MAIN]: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  [ROUTES.ACTIVITY.DETAIL]: { activityId?: string; inviteToken?: string; hostInvite?: boolean; fromGameRoom?: boolean };
  [ROUTES.ACTIVITY.CREATE]: { createMode?: 'sport' | 'class' } | undefined;
  [ROUTES.ACTIVITY.POST_GAME_ATTENDANCE]: { activityId: string };
  [ROUTES.CHAT.THREAD]: { conversationId: string; title?: string; activityId?: string };
  [ROUTES.FRIENDS.LIST]: undefined;
  [ROUTES.MY_GAMES.TAB]: undefined;
  [ROUTES.REGULAR_GROUP.CREW]: { groupId: string; initialTab?: string };
  [ROUTES.TOURNAMENT.MINI]: { tournamentId: string };
  [ROUTES.ADMIN.MAIN]: undefined;
  [ROUTES.FEEDBACK.MAIN]: undefined;
  [ROUTES.LANDING.SPORT]: { sport?: string };
  [ROUTES.COACH_PARENT.FAMILY_PROFILES]: undefined;
  [ROUTES.COACH_PARENT.GUARDIAN_CONSENT]: { childId: string };
  [ROUTES.COACH_PARENT.ADD_CHILD_PROFILE]: undefined;
  [ROUTES.COACH_PARENT.CLASS_DETAIL]: { classId: string; initialTab?: string };
  [ROUTES.COACH_PARENT.CHILD_PICKER]: undefined;
  [ROUTES.COACH_PARENT.PARENT_CLASS_INVITE]: { inviteToken: string };
  [ROUTES.COACH_PARENT.ENROLLMENT_CONFIRMATION]: { classId: string };
  [ROUTES.COACH_PARENT.COACH_PROFILE]: undefined;
};

// Global augmentation — eliminates as never at all navigate() call sites
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

Migration rules:
1. All local `*ParamList` / `*StackParams` types in screen files are deleted; screens import from `types.ts`
2. `useNavigation<any>()` → `useNavigation<NativeStackNavigationProp<RootStackParamList>>()`
3. `NativeStackNavigationProp<any>` props on `RallyChatPanel` / `RallyPlayPanel` are removed; those components call `useNavigation()` internally
4. All `navigate(... as never)` casts are removed (they now resolve correctly)
5. `navigationRef.navigate(... as any)` in `navigationRef.ts` is updated to the typed form

## Consequences

- **Positive:** 118 `as never` casts → 0; any route rename or param change immediately surfaces as a TS error across all call sites; future work (reactions, `useChatChannel`, ADR-0001 RPC) can navigate safely from hooks/components without casts.
- **Negative / cost:** ~4–6h one-time migration. Must keep `ROUTES` constants in sync with `RootStackParamList` (same keys); a mismatch won't cause a runtime error, but `tsc` will catch it.
- **Follow-ups:** After merge, run `grep -rn "as never" src/` → should return 0 results. Add to CI if lint rule isn't already enforcing it.

## Alternatives considered

| Option | Why not |
|--------|---------|
| Keep `as never` casts | Type safety gap grows with every new route; high cost at reactions + ADR-0001 feature PRs |
| Per-screen local types | Current state — 6 out-of-sync definitions prove this doesn't scale |
| `useNavigation<any>()` everywhere | Fully erases TS benefit for navigation layer |

## Verification

- `npx tsc --noEmit` with 0 `as never` remaining in `src/navigation/` and all component files.
- Rename any route in `ROUTES` → TypeScript errors immediately at all affected `navigate()` call sites.
- 0 new `as never` casts in the reactions or ADR-0001 RPC PRs (reviewer check).
