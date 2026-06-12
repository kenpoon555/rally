# Module contract — Invite links

**Contract id:** `module-invite-link`  
**Scope:** Game + Rally share URLs, landing pages, deep link routing  
**Canonical module:** `src/services/inviteLinkService.ts`  
**Routing:** `src/navigation/processDeepLink.ts`, `src/navigation/deepLinking.ts`  
**Landing:** `supabase/functions/game-invite/`, `supabase/functions/rally-invite/`

## Purpose

Standard invite links with **host vs public** behavior and install fallback for users without the app.

## URL matrix

| Kind | HTTPS query | Deep link | Recipient behavior |
|------|-------------|-----------|-------------------|
| **Game public** | `?activity={uuid}` | `rallyapp://game/{uuid}` | Game card → request to join |
| **Game host** | `?token={uuid}&host=1` | `rallyapp://host-invite/{token}` | Auto-join when spots open |
| **Rally group** | `?token={uuid}` | `rallyapp://group-invite/{token}` | Join Rally (+ next game) |
| **Legacy** | — | `rallyapp://invite/{token}` | View card (no auto-join) |

## API (required entry points)

| Function | Use |
|----------|-----|
| `buildGameShareUrl(activityId)` | Public link |
| `buildHostGameInviteUrl(token)` | Host link |
| `buildGameInviteMessage(activity, { asHost })` | Share copy |
| `shareGameInvite(activity, { asHost })` | Share sheet |
| `buildRallyGroupInviteUrl(token)` | Rally HTTPS link (falls back to scheme) |
| `buildRallyGroupInviteMessage(group)` | Rally share copy |
| `shareRallyGroupInvite(group)` | Rally share sheet |

## Rules for agents

1. **Never** build invite URLs inline in screens — use `inviteLinkService`.
2. **Host vs public** — host (`activity.user_id === viewer.id`) → host link; approved joiner sharing → public link.
3. **Signed-out deep links** — store pending via `pendingDeepLinkService`; replay after login in `AuthContext`.
4. **Install URLs** — `IOS_INSTALL_URL` / `ANDROID_INSTALL_URL` on Supabase secrets for landing page CTAs.
5. **Deploy** — `game-invite` and `rally-invite` edge functions with `--no-verify-jwt`.

## Pass/fail checklist

- [ ] Share from create game uses host invite
- [ ] Share from detail uses `shareModeForViewer` + `shareGameInvite`
- [ ] HTTPS landing opens TestFlight/Play when app not installed
- [ ] After install + reopen link → game card or auto-join (host)
- [ ] Rally share uses HTTPS `rally-invite` landing when Supabase functions URL is configured
- [ ] `__tests__/deepLinking.test.ts` passes

## Related

- [flow-invite-to-rally.md](./flow-invite-to-rally.md)
- [module-game-card.md](./module-game-card.md)
- [beta-testflight-play-internal.md](../beta-testflight-play-internal.md)
