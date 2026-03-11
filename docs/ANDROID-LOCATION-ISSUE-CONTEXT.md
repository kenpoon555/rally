# Android location issue – context for another agent

**Purpose:** Self-contained context so another agent or developer can fix Android location without prior chat history. iOS location works; Android does not reliably, and the app can stop/crash after a location timeout.

---

## 1. What we use to fetch location

| Item | Details |
|------|--------|
| **Library** | `react-native-geolocation-service` ^5.3.1 ([GitHub](https://github.com/Agontuk/react-native-geolocation-service)) |
| **API** | `Geolocation.getCurrentPosition(successCallback, errorCallback, options)` — one-shot, no watch on Android |
| **Android native providers** | Library can use either **FusedLocationProviderClient** (Google Play Services) or **LocationManager** (system API). We pass `forceLocationManager: true` on Android, so we use **LocationManager only** (no Fused). |
| **Entry point** | User pulls to refresh or taps "Retry location" on Discover → `useLocation`’s `fetchLocation()` → `getCurrentLocation()` in `locationService.ts` |

**Flow on Android (current code):**

1. `getCurrentLocation()` calls `getCurrentLocationOnce(true)` only (no retry with Fused).
2. `getCurrentLocationOnce(true)` calls `Geolocation.getCurrentPosition(..., options)` with `forceLocationManager: true`.
3. Library uses `LocationManager`: `getLastKnownLocation(provider)`; if null or too old, it calls `requestLocationUpdates()` and waits for one update or the timeout.
4. After **15 seconds** the library’s native timeout runs and invokes our error callback with code 3 ("Location request timed out").
5. We defer the promise reject with `InteractionManager.runAfterInteractions(() => reject(err))` so the promise chain runs after interactions.
6. In the hook, `fetchLocation`’s catch runs; we defer `setError` and `setLoading(false)` with `InteractionManager.runAfterInteractions` on Android.
7. **Observed:** The app often **stops or crashes** around or shortly after the timeout, even with all deferrals. So the crash may be in the native library when the timeout fires, or in the JS/bridge when the error callback is invoked.

---

## 2. Options we pass to getCurrentPosition (Android)

Current options in `getCurrentLocationOnce()` when `Platform.OS === 'android'`:

```ts
{
  enableHighAccuracy: false,
  timeout: 15000,           // 15s (shorter to fail fast; was 45s)
  maximumAge: 300000,       // 5 min (accept cached fix up to 5 min old)
  interval: 2000,          // ask native for updates every 2s (library default is 10s)
  fastestInterval: 1000,    // 1s (library default is 5s)
  forceRequestLocation: true,  // __DEV__ only
  forceLocationManager: true,  // we only use LocationManager on Android
  accuracy: { android: 'balanced' }  // PRIORITY_BALANCED_POWER_ACCURACY (was 'high', caused long wait for GPS)
}
```

- **Success path:** `setImmediate(() => resolve(location))`.
- **Error path (Android):** `InteractionManager.runAfterInteractions(() => reject(err))` (no `setImmediate` or `setTimeout` in the error callback, to avoid running promise chain on native callback stack).

---

## 3. Relevant files and behavior

| File | Role |
|------|------|
| `RallyApp/src/services/locationService.ts` | `checkLocationPermission`, `requestLocationPermission`, `getCurrentLocation` / `getCurrentLocationOnce`. Contains debug instrumentation in `// #region agent log` blocks (can be removed once issue is fixed). |
| `RallyApp/src/hooks/useLocation.ts` | Discover uses `useLocation(false, { skipPermissionCheckOnMount: true })` on Android. No permission check and no auto-fetch on mount. Location is fetched only when user pulls to refresh or taps "Retry location" → `fetchLocation()`. Has `mountedRef` guard and defers `setError`/`setLoading(false)` with `InteractionManager.runAfterInteractions` on Android. |
| `RallyApp/src/pages/Home/HomeScreen.tsx` | Shows "Location permission needed…", "Getting location…", or "Couldn't get coordinates" / "Location timed out…" and "Retry location". Pull-to-refresh triggers `fetchLocation()`. |
| `RallyApp/android/app/src/main/AndroidManifest.xml` | Declares `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`. |

---

## 4. What works

- **iOS:** Permission and `getCurrentPosition` work. Auto-fetch on Discover when permission is granted works.
- **Android permission:** Request and check work; logs show `fine= true coarse= true`, `permission check result: true`.
- **Android startup:** No location on mount and fetch only on user gesture avoids startup crashes.

---

## 5. What we see on Android

- **Permission:** Granted.
- **Location request:** `getCurrentPosition` is called with the options above (LocationManager, 15s timeout, balanced accuracy, interval 2s / fastest 1s). In-app debug shows e.g. `getCurrentLocation called, timeout= 15000 ms (LocationManager)`.
- **Result:** After ~15s the **error callback fires** (code 3, "Location request timed out"). Then the app **stops or crashes** (often shortly after), so we don’t reliably get to the "Couldn't get coordinates" / "Retry location" UI.

---

## 6. What we’ve already tried

| Attempt | Result |
|--------|--------|
| `enableHighAccuracy: false` | Still timeout. |
| `accuracy: { android: 'high' }` | Long wait for GPS; still timeout (and [library #296](https://github.com/Agontuk/react-native-geolocation-service/issues/296) workaround didn’t fix our case). |
| `accuracy: { android: 'balanced' }` | Still timeout; no success in logs. |
| `interval` / `fastestInterval` (2s / 1s) | To get first fix sooner; still timeout. |
| `forceRequestLocation: true` | No clear improvement. |
| `forceLocationManager: true` only (LocationManager, no Fused) | Still timeout; we use this now. |
| Retry: LocationManager then Fused (with 800ms delay) | Still timeout; second request seemed to make "timeout then stop app" worse, so retry was removed. |
| Shorter timeout (15s) | Fail faster; app still stops after timeout. |
| `setImmediate` before resolve/reject | Used initially; then we tried `setTimeout(..., 100)` and finally `InteractionManager.runAfterInteractions(() => reject(err))` on Android to avoid running promise chain on native callback stack. |
| In hook: `InteractionManager.runAfterInteractions` for `setError` and `setLoading(false)` on Android | Still stops/crashes. |
| `mountedRef` guard before any setState in fetchLocation | Kept; still stops/crashes. |
| No automatic location on Android on mount | Kept; user must pull-to-refresh or tap "Retry location". |
| 300 ms delay before calling getCurrentPosition (in fetchLocation) on Android | Kept to stay off gesture handler stack. |

---

## 7. Library behavior (useful to know)

- **FusedLocationProvider:** First calls `getLastLocation()`; if non-null and age &lt; maximumAge, returns it immediately. Otherwise `checkLocationSettings()` then `requestLocationUpdates()`; timeout runnable fires after `timeout` ms and calls the error callback (code 3) and `removeLocationUpdates()`.
- **LocationManagerProvider:** Uses `getLastKnownLocation(provider)`; if non-null and fresh, returns immediately. Otherwise `requestLocationUpdates()` and a timeout runnable; on timeout it invokes the error callback and removes updates.
- **Options:** Library reads `interval`, `fastestInterval`, `timeout`, `maximumAge`, `accuracy.android`, `forceLocationManager`, `forceRequestLocation` from the options map. Defaults when not passed: interval 10s, fastestInterval 5s (so first update can be delayed 5–10s; we pass 2s/1s).

---

## 8. Debug instrumentation (current)

In `locationService.ts`:

- `DEBUG_HOST`, `DEBUG_INGEST_URL`, `agentLog()` at top (and a few `// #region agent log` blocks) send logs to a debug ingest. These can be removed when the issue is resolved.
- `addLocationLog()` and `sendDebugLog()` are used for in-app "Location debug" and other logging.

Reproduce: Discover → pull to refresh or "Retry location". Watch "Location debug" and/or ingest logs; you should see entry, then after ~15s the error callback log, then the app may stop.

---

## 9. What would fix it (for the next person)

1. **Why does the app stop after the timeout?**  
   Determine whether the crash is in the **native** library (timeout runnable / removeLocationUpdates / invoking the error callback) or in **JS** (bridge or React when the error callback runs or when we runAfterInteractions). If it’s native, consider patching the library or using another (e.g. expo-location, or a minimal native module that only uses getLastKnownLocation and doesn’t use requestLocationUpdates + timeout).

2. **Why does getCurrentPosition never succeed on Android (emulator)?**  
   Even with balanced accuracy and interval/fastestInterval, we never see the success callback. Either getLastKnownLocation is always null (or too old) on the emulator and requestLocationUpdates never delivers a fix, or something else is wrong. Testing on a **real device** with real GPS would confirm if this is emulator-only. If it works on device, document "use real device for location testing" and optionally keep a graceful timeout + error UI on emulator.

3. **Alternative: don’t rely on requestLocationUpdates for one-shot.**  
   e.g. Use only getLastKnownLocation (or equivalent) and if null/old, show "Location unavailable" instead of waiting for a fix. That would avoid the timeout path that leads to the stop/crash.

4. **Alternative: different library or native implementation.**  
   e.g. expo-location, react-native-location, or a small native module that returns last known location and/or requests a single update with a simpler timeout/cleanup that doesn’t crash.

---

## 10. Quick commands

```bash
cd RallyApp
npm start
npx react-native run-android
```

- Emulator: Medium_Phone_API_35 (Android 35). Mock location: Extended Controls → Location → Set location, GPS on.
- Trigger location: Discover tab → pull to refresh or tap "Retry location".
- In-app "Location debug" (dev) shows permission and getCurrentPosition logs.

---

*Last updated to match current code: LocationManager only on Android, no retry, 15s timeout, balanced accuracy, interval 2s/1s, error path deferred with InteractionManager, hook defers setError/setLoading on Android. App still times out and then stops/crashes.*
