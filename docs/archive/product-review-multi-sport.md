# Product review — simplified model & multi-sport expansion

Last updated: 2026-05-31

## The model you have now (and why it’s simpler)

Rally’s beta loop is intentionally **low coordination overhead**:

| Old complexity | Now |
|----------------|-----|
| Flex matching + preference scoring | **Fixed time** default; flex hidden unless sport metadata says otherwise |
| RSVP going/maybe/not | **Removed** — join + Ready + host finalize |
| Platform schedules for you | **Host sets time/court**; players coordinate in **Game Room chat** |
| Perfect court database | **Nearby seeds + host adds court + chat for details** |
| Anonymous until confirmed | Still true for Discover; lobby unlocks after approve |

**Organizer responsibility** sits with the host (time, court, cost note, who gets in). Rally provides **discovery, chat, trust signals, and crew replay** — not a league office.

That pattern applies to most **pick-up / court / field** sports where:

- You need N people at a place at a time
- Exact logistics (which gate, split cost) are chat-sized
- No standings, refs, or season schedule required

---

## What you can add *without* breaking simplicity

**Tier A — fits the current loop (do during beta)**

| Feature | Why it fits |
|---------|-------------|
| **Cost note + chat pin** | Already shipped — host owns money/logistics copy |
| **Add court from Places** | Fills data gaps without ops team |
| **Report court issue** | Community freshness, no admin UI yet |
| **Regulars + replay** | Retention wedge; same UI for all court sports |
| **Rate Players** | Post-game trust; sport-agnostic |
| **Friend-aware Discover** | Better fill rate; no new screens |
| **Invite-only + List on Discover** | Host controls openness |

**Tier B — still simple, after retention proof**

| Feature | Notes |
|---------|--------|
| **Sport-specific copy only** | e.g. "Need 1 more for doubles" vs "Need 2 for 3v3" — metadata, not new flows |
| **Default player count by sport** | `minPlayers` in `sports.ts` already exists |
| **Running / hiking as "meetup pin"** | Looser location (`locationStrictness: loose`); same Create → chat loop |
| **Organizer Pro (gated)** | Waitlist, attendance export — host tools, not player complexity |

**Tier C — defer (needs Teams/Leagues)**

Standings, seasons, refs, team registration, sub boards, league pricing.

---

## Should you launch many sports?

### Short answer

**Yes in code, no in marketing — for beta.**

Turn on sports via `launchEnabled: true` in `src/constants/sports.ts`. **Do not** splash 10 sports in App Store positioning until each has seed courts or Places works in your launch city.

### What generalizes with zero UI redesign

Everything below is already **sport-parameterized**:

- Discover filter chips (`useSportsCatalog` → launch sports only)
- Create Game sport pills + `SportIcon`
- GameCard / Game Room header (sport name + icon)
- Fixed-time create path
- Join → chat → Ready → Finalize
- Regulars, ratings, trust preview

Adding **Tennis** or **Running** = flip `launchEnabled` + optional seed courts + icon already in enum.

### What needs per-sport tuning (metadata only, not new screens)

| Knob | Example |
|------|---------|
| `minPlayers` / default missing count | Badminton 2, basketball 4–6 |
| `defaultSchedulingMode` | Keep `fixed` for beta |
| `locationStrictness` | Strict for courts; loose for trails |
| Copy in `ACTIVITY_DETAIL_COPY_BY_PROFILE` | Already keyed by `matchingProfile` |
| Court seeds | Per-region scripts, or rely on Places add |

### UI impact of many sports

| Surface | Impact if you add 3 → 8 launch sports |
|---------|----------------------------------------|
| **Discover filter** | More chips — use **horizontal scroll** (already Chip row); consider **"All sports"** default |
| **Create Game picker** | Same — scroll row of pills; OK up to ~6 visible |
| **Tab bar / navigation** | **No change** — no sport tabs |
| **Game Room / Chats** | **No change** — sport icon on row |
| **Profile default sport** | One picker — list grows; fine |
| **Empty Discover** | Worse if you enable sport without local courts — mitigate with Places add + "All sports" filter |

**Recommendation:** Beta ships **10 launch sports** in app (horizontal Discover filters). **Market** around your host density — lead with Pickleball/Basketball/Badminton in invites; mention Tennis/Volleyball/Soccer when relevant; highlight Squash/Racquetball/Table Tennis/Ultimate for “need a partner/crew” positioning. Running/Hiking stay off until meetup wedge is tested.

Do **not** add a sport grid homepage or sport-specific tab bar — that’s premature and fights chat-first.

---

## Positioning one-liner

> **Rally is group chat for pick-up sports** — host sets time and place, players join and coordinate in the lobby, crews come back weekly. Sport type is a filter, not a separate product.

---

## Decision summary

| Question | Answer |
|----------|--------|
| Is fixed-time + host + chat simple enough to scale? | **Yes** — core loop is sport-agnostic |
| Add many sports now? | **Enable in config gradually**; market 1–3 sports in beta |
| UI rewrite for multi-sport? | **No** — only filter/picker density; watch chip overflow |
| Courts in new areas? | **Places add + reports**; not manual ops at scale |
| When to add leagues/teams UI? | After **crew replay** metric justifies it (see `open_items.md`) |

See also: [court-data-strategy.md](court-data-strategy.md), [NEXT.md](NEXT.md).
