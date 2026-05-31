# Post-preview testing backlog

**When to run:** After the first **EAS preview** build is on physical devices (not before).

**Do not block preview ship on these** — code paths exist; this is device sign-off only.

Last updated: 2026-05-29

---

## Phase 4 — Push notifications (physical devices)

**Prerequisites (one-time, Mac/browser):**

- [ ] APNs `.p8` uploaded in [Firebase Cloud Messaging](https://console.firebase.google.com/project/rally-32e72/settings/cloudmessaging/ios:1:567443883022:ios:412841b0fc29cbe1ac685f)  
  - Key: `AuthKey_T6JZDP4553.p8` · Key ID `T6JZDP4553` · Team ID `ZH8LXXFNSQ`  
  - Helper: `scripts/setup-apns-firebase.sh --open`
- [x] `FIREBASE_SERVER_KEY` on Supabase (`casljueycxsqexpkdiuq`)
- [x] Edge Function `send-push` deployed

**Test on Rally app (not Firebase website):**

| # | Test | How | Pass |
|---|------|-----|------|
| 1 | Host token registers | Physical **iPhone** → install **preview build** → sign in as host → **Allow** notifications | Row in `user_device_tokens` (`platform = ios`) |
| 2 | Guest join → host push | Second account requests join on host’s game | Host gets notification (app background or locked) |
| 3 | Tap notification | Tap push on host phone | Opens **Activity Detail** for that game |
| 4 | Foreground | Host app open; guest joins | Alert + **Open** navigates to detail |
| 5 | Android (optional) | Repeat 1–3 on Android preview build | Token + push on `platform = android` |

**Checklist detail:** [phase-4-notifications-validation-checklist.md](phase-4-notifications-validation-checklist.md) Cases 1–5.

**SQL after host sign-in:**

```sql
select user_id, platform, left(device_token, 24) as token_prefix, updated_at
from user_device_tokens
order by updated_at desc;
```

---

## Phase 3 — Core loop (preview smoke)

Quick pass on preview builds (two accounts):

- [ ] Discover → create game → court + time
- [ ] Guest join request → host approve
- [ ] Activity chat opens with 2+ players
- [ ] My Games on Profile
- [ ] Listing expiry / extend start (optional)

Doc: [smoke-test-join-pickleball.md](smoke-test-join-pickleball.md)

---

## Phase 6–8 — Optional after core pickleball path

- [ ] Flexible “I’m flexible on time” create + finalize (Phase 6)
- [ ] Review prompts after game end + submit review (Phase 7)
- [ ] Profile defaults + chat unread (Phase 8)

---

## Notes

- **Simulator:** FCM token often fails — expected; use real devices for Phase 4.
- **In-app fallback:** Host still gets Realtime alert on Activity Detail while app is open (works without push).
