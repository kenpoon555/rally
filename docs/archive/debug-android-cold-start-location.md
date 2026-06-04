# Android location crash – root cause and fix

## Root cause

1. **`Geolocation.watchPosition()` (react-native-geolocation-service) on Android** causes a native crash when started after the user has just granted location permission (or when opening a tab that starts the watch). The crash happens in native code after `watchPosition` is invoked, before the first position is delivered to JS. Deferring (InteractionManager, 3s delay) did not help.
2. **Running location work during the permission grant flow** (e.g. `fetchLocation()` on the same screen mount that triggers `requestPermission`) can also crash or restart the app. Avoiding any location fetch on Discover mount fixed “enable location → tap Home” until we also fixed Map.

## Permanent fix

**Do not use continuous location (`watchPosition`) on Android.** Use one-shot location only (`getCurrentPosition` via `fetchLocation()`):

- **Discover (Home):** `useLocation(false)`. No fetch on mount; user pulls to refresh to get location.
- **Map:** `useLocation(false)`. `fetchLocation()` when tab is focused; refresh control to update.
- **Create Activity:** `useLocation(false)`. `fetchLocation()` on mount so the form gets coordinates.

All screens use `useLocation(false)` and `fetchLocation()` (one-shot). In addition, **the hook itself** skips starting the watch on Android: `if (Platform.OS !== 'android')` before `startWatching()`, so `watchPosition` is never used on Android. Lazy tabs (`lazy: true`) remain.

**One-shot deferral:** After the guard, logs showed no `watchPosition` but crash after `getCurrentLocation` (getCurrentPosition). The native success callback was resolved in the same tick, so React setState ran from the native callback path. **Defer resolve:** in `getCurrentLocation` we now `setImmediate(() => resolve(location))` so the native stack unwinds before we update React state.

---

## Evidence (debug session)

**Issue (original):** App kicks user out after enabling location and tapping Home, or when opening the Map tab.

---

## Evidence from logs

| Run | Observation |
|-----|-------------|
| Log 1 | Two full cold-start sequences; no log after `watchPosition` in first run → crash after native watch started. Second run = restart. |
| Log 2 | Same: no `firstLocationUpdate` ever → crash happens after `watchPosition` called, before (or as) first position callback runs. |
| Log 3 | With Home on useLocation(false): we see checkPermission → requestPermission, then **no** hasPermission — crash during/after Android permission flow (PermissionsAndroid.request or when handling result). |

**H7 (no watch on Home):** Didn’t fix. Crash is **not** from watchPosition on Home; it’s in the permission path when user enables location and taps Home.

---

## Hypotheses tested

| ID | Hypothesis | Result | Evidence |
|----|------------|--------|----------|
| H1 | Auth loading delayed by location | **REJECTED** | `setLoadingFalse` within ~100–700 ms of `checkSession`. |
| H2 | Multiple watchers (Home + Map) at cold start | **Mitigated** | `lazy: true` on tabs → single location flow per run. |
| H3 | Android permission / watch blocks main thread | **INCONCLUSIVE** | Permission path runs; crash after watch started. |
| H4 | Startup race (Firebase / notification init) | **REJECTED** | Order: bundle → Firebase → auth → location. |
| H5 | watchPosition too early (same frame as mount) | **REJECTED** | Deferred with `InteractionManager.runAfterInteractions`; crash unchanged. No `firstLocationUpdate` → crash in native or in first callback before log is sent. |

---

## Fixes applied (current)

- **Lazy tabs** (`AppNavigator.tsx`): `lazy: true` so only the focused tab mounts → one `useLocation(true)` at cold start. **Kept** (reduces duplicate watchers).
- **InteractionManager deferral**: Defer `startWatching()` until after interactions. **REVERTED** (no improvement).
- **H6 (3s delay):** Reverted.
- **Current fix (H7):** Discover uses one-shot location only; no watchPosition on Home. If cold start succeeds → failure is “watchPosition in first few seconds”; then we can design a proper fix (e.g. start only on tab focus after first paint, or after user interaction).
