# Map Tab "Maximum Update Depth" – Hypotheses

**Archived:** 2026-02-27 — Root cause identified and fixed in `useLocation` (ref-based watch ID). See PROJECT_CONTEXT.md § Guardrails → React / Hooks.

---

## Hypotheses

| ID | Hypothesis | How to eliminate |
|----|------------|------------------|
| **H1** | **MapView (react-native-maps)** – Mounting or receiving `initialRegion` triggers native callbacks (e.g. region sync) that cause React setState → re-render → loop. | Replace MapView with a plain View. If error goes away → **H1 CONFIRMED**. |
| **H2** | **useActivities on MapScreen** – `location` or deps change every render → fetchActivities new → effect runs → setState → re-render → loop. | Don't call useActivities on MapScreen (e.g. pass empty data). If error goes away → **H2 CONFIRMED**. |
| **H3** | **useLocation on MapScreen** – Tab focus triggers location watch that fires repeatedly or triggers setState in a loop. | Don't call useLocation on MapScreen (e.g. pass null location). If error goes away → **H3 CONFIRMED**. |
| **H4** | **Ref / initialRegion / key** – Reading or passing `stableInitialRegion` or the key causes MapView or parent to update → loop. | Already tried stable ref + key; if H1 is rejected, revisit. |
| **H5** | **FlatList or other child** – FlatList/overlays cause setState during render or onLayout loop. | Remove FlatList/overlays; if error goes away → **H5 CONFIRMED**. |
| **H6** | **Tab navigator** – Switching to Map tab causes multiple state updates in React Navigation. | Unlikely to be RN nav alone; usually in combination with a child. |

## Elimination order

1. **H1 first** – Replace MapView with a View. Easiest and most likely (native map components often drive region/layout callbacks).
2. If H1 confirmed → Fix: avoid MapView driving updates (e.g. render MapView in a delayed mount, or use a map that doesn't sync region back).
3. If H1 rejected → Try H2, then H3, then H5.

## Results

- **H1 REJECTED** – Error still occurred with MapView replaced by a View. MapView is not the cause.
- **H2 REJECTED** – Error still occurred with useActivities stubbed (no location passed). useActivities is not the cause.
- **H3 CONFIRMED** – Error gone when useLocation(false) (watch never started). Root cause: **useLocation** hook.

## Root cause (H3)

In `useLocation`, `startWatching` was in the dependency array of the effect that calls it, and `startWatching` depended on `watchId`. So: effect runs → `startWatching()` → `setWatchId(id)` → re-render → new `startWatching` (because `watchId` changed) → effect runs again → infinite loop.

**Fix:** Use a ref `watchIdRef` for the current watch ID. `startWatching` and `stopWatching` read/write via the ref and have empty dependency arrays `[]`, so they are stable. The effect that calls `startWatching()` only runs when `autoStart` or `hasPermission` changes, not when `watchId` changes. Cleanup effect still runs when `watchId` changes (to stop the previous watch on unmount).
