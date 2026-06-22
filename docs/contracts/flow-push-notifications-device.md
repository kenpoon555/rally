# Flow — Push notifications (physical device)

**Contract id:** `flow-push-notifications-device`  
**Status:** Active — P0 bug (Jun 2026)  
**Related code:** `src/services/notificationService.ts`, `src/services/pushDispatchService.ts`, `supabase/functions/send-push/`, `index.js`, `App.tsx`

Registry: [PUSH_NOTIFICATIONS.md](../PUSH_NOTIFICATIONS.md)

## Purpose

Background push reaches the recipient on **physical** iOS and Android store/preview builds — not simulators.

North-star: **Friend sends chat while recipient app is backgrounded → banner appears → tap opens correct screen.**

## Preconditions (Validator must verify before fail)

| Check | How |
|-------|-----|
| **Build** | TestFlight/production build **8+** (not dev client without entitlements) |
| **Permissions** | Settings → Rally → Notifications **On** |
| **Token** | `user_device_tokens` row for recipient after login |
| **Server** | `send-push` deployed with `FIREBASE_SERVICE_ACCOUNT_JSON` (FCM v1) |
| **Test state** | Recipient app **backgrounded or killed** — not foreground in chat |

## Demo setup

1. **Phone A (recipient):** `@kunyu` or second demo account — log in, allow notifications, background app.
2. **Phone B (sender):** `@kunyu` friend or `marcus@…` — send **friend DM** or **game chat** message.
3. Optional: host join-request push (Phone B host, Phone A player requests join).

DB check (linked production):

```sql
select user_id, platform, left(device_token, 12) as token_prefix, updated_at
from user_device_tokens
where user_id = '<recipient_uuid>';
```

## Required states

| State | Must show |
|-------|-----------|
| **Login + allow** | Token upserted to `user_device_tokens` |
| **Background chat_message** | iOS banner / Android notification tray |
| **Tap notification** | Opens chat thread or activity detail per `navigationRef` |
| **Foreground chat** | In-app Alert (not system banner) — expected |
| **Quiet hours off** | Both profiles have no active quiet-hours block during test |

## Pass/fail checklist

### Client (device)

- [ ] Fresh install → login → token row created within 60s
- [ ] Re-open app after TestFlight update re-registers token
- [ ] Background: `chat_message` push received (friend DM)
- [ ] Background: `join_request` push received (optional)
- [ ] Tap push deep-links to correct screen
- [ ] Foreground: in-app alert shown (not silent)

### Server

- [ ] `send-push` returns `{ ok: true, sent: >= 1 }` for chat (check Supabase function logs)
- [ ] Invalid/expired token errors logged but do not crash sender flow

## Screenshots required

`docs/contracts/screenshots/flow-push-notifications-device/`

| File | State |
|------|-------|
| `01-settings-notifications-on.png` | iOS Settings → Rally → Allow |
| `02-background-chat-banner.png` | Banner while app backgrounded |
| `03-tap-opens-chat.png` | After tap — correct thread |

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-21 | Device still not receiving chat push after build 9 — validate token + FCM v1 end-to-end | — |
| 2026-06-21 | Validator blocked: Jade iPhone unavailable; sim cannot run APNs/FCM checklist — resume with `./.cursor/hooks/validation-loop-start.sh --queue gtm2-feedback-jun-2026 --from flow-push-notifications-device` on physical hardware | Validator |

## Out of scope

- Simulator push (APNs unavailable)
- Planned types in PUSH_NOTIFICATIONS.md "Planned" table (friend_request, etc.)

## Related

- [flow-auth-onboarding.md](./flow-auth-onboarding.md) — bootstrap must not block token registration
- [flow-inbox.md](./flow-inbox.md) — chat threads
