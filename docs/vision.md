# Rally — vision & strategy (canonical)

**Last updated:** 2026-06-15  
**Status:** Long-term product direction. **Active go-to-market plan:** [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) (Jun 2026 — store review, beta groups, monetization gates).  
**Supersedes:** advisor planning docs in [archive/](./archive/) for day-to-day priorities.

**Context:** App near live / in App Store review. **This quarter:** prove real groups complete the core loop before expanding Coach Pro, discovery, or payments.

**Core strategy:** Rally should become **chat + sports operating system**, not better group chat. Win on things WhatsApp cannot do well.

**Ops (not duplicated here):** [FOUNDER_WEEK2_CHECKLIST.md](./FOUNDER_WEEK2_CHECKLIST.md) · [PUNISHMENT_AND_TRUST.md](./PUNISHMENT_AND_TRUST.md) · [ROSTER_COMMITMENT_POLICY.md](./ROSTER_COMMITMENT_POLICY.md) · [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) · [archive/SHIPPED_AND_DEFERRED_2026-06.md](./archive/SHIPPED_AND_DEFERRED_2026-06.md)

---

## Alignment with the app today (2026-06-15)

| Vision item | Status | Notes |
|-------------|--------|--------|
| Rally + persistent crew chat | **Shipped** | One `crew_group` thread per Rally |
| Session / game cards (Join, I'm in, lock) | **Shipped** | Rally chat + game room + Discover `GameCard` |
| Listing title + play intent (Discover) | **Shipped** | Stage 1 browse for strangers |
| Waitlist | **Shipped** | |
| Post-game attendance → reliability | **Shipped** | Validated phase1a |
| Post-game recap | **Shipped** | Validated phase2-recap |
| Mini tournament in Rally | **Partial** | Racket sports only; phase1c |
| Schedule next / invite link | **Shipped** | |
| Friends, inbox, trust preview | **Shipped** | No public feed |
| Admin metrics | **Shipped** | Admin → Metrics (migration 035) |
| Availability poll | **Shipped** | Backend + UI; phase1b validated |
| Auto rotation / pairing | **Partial** | phase1c |
| In-group leaderboard | **Partial** | phase1c |
| Rich court/venue block | **Partial** | phase2-game-card contract |
| Host nudges | **Shipped** | phase1a |
| Payment handle on profile | **Not built** | Cost note on game only — monetization GTM 3 |
| Need Players / Free Agent boards | **Deferred** | After real group validation — [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) |
| Sport Captain program | **Relationships first** | GTM 2 — not code sprint |
| Coach / Organizer Pro | **Deferred** | Manual founding offers before Stripe — GTM 3 |
| Group calls, audio, stickers | **Deferred** | Correct per vision |

**Verdict:** Core loop is shippable. **Next risk is expansion before repeat use** — see [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md). Retention → liquidity build order unchanged; Discover is secondary until GTM 2 passes.

**North star:** `analytics_crew_lifecycle.retained` (% Rallies replay in 14 days) + weekly scorecard in launch roadmap.

---



## Core Strategy



Rally should become:



> Chat + sports operating system.



Not:



> Better group chat.



Build things WhatsApp cannot do well.



---



## Target Audience Order



1. **Players who cannot find others** — unpopular sports, large roster sports (soccer). Highest pain, most willing to pay.

2. **Group members who play regularly** — they provide liquidity.

3. **Less motivated players** — gamification and easy play attach them.

4. **Social players** — sport as social activity. Join after others feel proud.



---



# Target 1: Keep Existing Group Members In App



## Do Not Prioritize First



Do not prioritize these yet:



- Group calls

- Audio messages

- Heavy media chat

- Stickers as a main feature



They make Rally more expensive and still worse than WhatsApp/LINE/iMessage.



## Prioritize Sports-Native Retention



### 1. Game Session Cards



Every group chat should have clear sports cards:



```text

Thu 7:30 PM Badminton

8 spots · 6 joined · 5 I'm in

[Join] [I'm in] [Open roster]

```



This is your core advantage.



### 2. Availability Poll



Before scheduling:



```text

Who can play this week?

Mon 7 PM

Tue 8 PM

Thu 7:30 PM

Sat 10 AM

```



High-value for every group.



### 3. Auto Rotation / Pairing



For badminton/pickleball:



- Generate doubles teams

- Rotate partners

- Avoid same partner repeatedly

- Balance by skill

- Track court order



Very valuable and not too "league-heavy."



### 4. Mini Tournament



Inside one Rally group:



- Round robin

- King/Queen of Court

- Ladder night

- Random doubles tournament

- 3v3 bracket for basketball



Move this up the roadmap.



### 5. Leaderboard Inside Group



Not public ranking yet. Just group pride:



- Games played

- Attendance streak

- Win/loss if tournament mode

- "Most reliable"

- "Most improved"

- "Played 5 weeks in a row"



### 6. Post-Game Recap



After each game:



```text

Tonight's Rally

8 players showed up

3 courts used

MVP: Amy

Longest streak: Ken, 5 weeks

[Share recap]

```



Creates emotion and habit.



### 7. Court / Venue Info



Add this. For each court:



- Address

- Parking note

- Cost

- Open hours

- Number of courts

- Busy times

- Booking link

- "Usually full after 7 PM"

- "Good for beginners"



Practical and helps discovery.



### 8. Payment Handle In Profile



Keep simple:



```text

Payment note:

Venmo: @kenpoon

Zelle: 626-xxx-xxxx

Court fee: usually $8/person

```



Do not build payment processing yet.



### 9. Host Tools



Make hosts love it:



- Reuse last game

- Schedule next game

- Invite previous players

- Nudge people who haven't tapped "I'm in"

- Lock roster

- Waitlist

- Auto-fill missing players from public pool



### 10. Social Proof



Let users feel proud:



- Profile sports card

- Attendance streak

- Reliability badge

- Rally history

- "Played 12 games"

- "Hosted 5 games"

- Shareable recap image



Helps later social players join.



---



# Target 2: Attract Players Who Cannot Find Others



Harder. Need **sport-by-sport liquidity**, not generic user acquisition.



## Best First Principle



Do not start with players. Start with **hosts/captains**.



For every sport, find the person already doing painful coordination.



| Sport | Organizer Persona |

|---|---|

| Soccer | Pickup captain who needs 14-22 players |

| Volleyball | Gym/open-play organizer |

| Badminton | Court-booker / group admin |

| Pickleball | Host with recurring court time |

| Tennis | Ladder organizer |

| Ultimate frisbee | Weekend captain |

| Basketball | 3v3/5v5 gym organizer |



One good host can bring 20-80 users.



## Acquisition Actions



### 1. Create Sport Captain Program



Offer:



- Free Founder Host status

- Free Plus/Organizer tools

- Badge

- Early influence on features

- Maybe future revenue share for paid leagues



Copy:



```text

Become a Rally Sport Captain.

Bring your local pickup group onto Rally and get founder benefits.

```



### 2. Make City + Sport Landing Pages



Examples:



```text

LA Badminton Pickup

LA Pickleball Open Play

Pasadena Badminton Games

Santa Monica Volleyball Pickup

```



Each page should have:



- Current games

- Start a Rally

- Contact founder

- Join waitlist



### 3. Manual Concierge Matching



At first, do it manually.



If someone says: "I want to play soccer in LA."



Manually connect them to a host or create a game.



This teaches you the market.



### 4. Partner With Venues



Venues want courts filled.



Offer:



- Free court page

- Open-play calendar

- "Find players for this court"

- Host tools for their regulars



Start with badminton/pickleball courts.



### 5. Partner With Coaches



Coaches have students who need practice partners.



Offer:



- Student practice Rally

- Beginner-friendly games

- Coach profile later



### 6. Create "Need Players" Board



Critical.



```text

Need 3 players tonight

Need goalie Sunday

Need 2 intermediate badminton players

Need 1 woman for co-ed volleyball

```



Directly targets pain.



### 7. Free Agent Board



For people without groups:



```text

I want to play

Sport: Badminton

Level: Intermediate

Available: Tue/Thu nights

Location: Pasadena

```



Hosts can invite them.



### 8. Seed Rally-Hosted Games



If no hosts exist, you host the first games.



Do not wait for organic liquidity.



---



# Best Product Direction Now



Build in this order:



1. Make current Rally group experience fun and useful

2. Add availability poll

3. Add rotation/pairing

4. Add mini tournament

5. Add venue/court info

6. Add Need Players board

7. Add Free Agent board

8. Recruit sport captains

9. Partner with courts/coaches

10. Then expand sport-by-sport



## Strong Recommendation



Next big feature:



> **Mini Tournament + Rotation Generator inside Rally groups**



Helps current users immediately and creates shareable proof:



```text

Amy won Tuesday doubles night

Ken has 6-week attendance streak

Pasadena Rally has 18 active players

```



That turns a chat group into culture.



## One Clear Warning



Do not spend too much time making chat richer. WhatsApp will always beat you at chat.



Win before game, during game, and after game:



```text

Before: schedule, poll, fill spots

During: roster, rotation, tournament

After: recap, attendance, leaderboard

```



That is Rally's lane.



---



# Action Items Summary



## For Current Groups (Target 1)



| Priority | Action |

|---|---|

| High | Session cards, availability poll, rotation/pairing |

| High | Mini tournament, in-group leaderboard |

| High | Post-game recap, court/venue info |

| Medium | Payment handle in profile (Venmo/Zelle note) |

| Medium | Host tools (nudge, waitlist, reuse last game) |

| Medium | Social proof (streaks, badges, shareable recap) |

| Low | Stickers, audio, group calls (defer) |



## For New Players (Target 2)



| Priority | Action |

|---|---|

| High | Sport Captain program |

| High | Need Players board |

| High | Free Agent board |

| High | Manual concierge matching |

| Medium | City + sport landing pages |

| Medium | Partner with venues |

| Medium | Partner with coaches |

| Medium | Seed Rally-hosted games |

| Ongoing | Recruit one host per sport type |



---



# Two Targets Tied to Audience



| Target | Audience | Key Actions |

|---|---|---|

| **Keep group members in app** | Regular players, group members | User-friendly, low latency, session cards, poll, rotation, mini tournament, leaderboard, recap, court info, host tools |

| **Attract unpopular sport players** | Players who cannot find others | Sport captains, Need Players board, Free Agent board, venues, coaches, landing pages, concierge matching |



Both targets support liquidity: groups stay in app; new players get matched to hosts and groups.



---



# Technical Roadmap



Ordered build sequence. Each phase unlocks the next. Do not skip reliability work at the top.



## Principles



- **Retention before acquisition.** Groups must love in-Rally play tools before we push strangers into Discover.

- **One persistent Rally chat.** New features attach to session cards and group context, not new chat silos.

- **Server-side truth.** Scheduling, roster lock, attendance, tournaments, and boards use Supabase RPCs + RLS — not client-only state.

- **Sport templates later.** Ship generic v1 first; captains help tune rules sport-by-sport.



## Phase 0 — Beta Reliability (Done / Maintain)



**Goal:** Current loop is boringly reliable on two real devices.



| # | Item | Status |

|---|---|---|

| 0.1 | Auth, profile, LA beta (badminton · pickleball · basketball) | Shipped |

| 0.2 | Public game create + Discover + listing title/intent | Shipped |

| 0.3 | Rally create + one `crew_group` chat per Rally | Shipped |

| 0.4 | Session cards in chat (Join → I'm in → Lock roster) | Shipped |

| 0.5 | Waitlist, post-game attendance, reliability line | Shipped (attendance on Game card) |

| 0.6 | Today tab, inbox archive, game room polish, P0 QA | In progress |



**Exit criteria:** Two-device QA pass; no duplicate inbox rows; attendance updates reliability; host lock works with non-host joiners.



---



## Phase 1 — Group Play OS (Retention Core)



**Goal:** Rally beats WhatsApp for *running* a session, not chatting.



| # | Feature | Depends on | Target |

|---|---|---|---|

| 1.1 | Session card polish (roster states, host actions, empty states) | 0.4 | T1 |

| 1.2 | Availability poll (pre-schedule vote on times) | 0.3 | T1 |

| 1.3 | Auto rotation / pairing generator | 1.1 | T1 |

| 1.4 | Mini tournament (round robin, king/queen, ladder night) | 1.3 | T1 |

| 1.5 | In-group leaderboard (attendance, streaks, tourney W/L) | 1.4, 0.5 | T1 |



**Exit criteria:** One real Rally runs poll → session → rotation or mini tourney → recap without leaving the app.



**Recommended sprint order:** 1.1 → 1.2 → 1.3 → 1.4 → 1.5



---



## Phase 2 — After-Game & Practical Info



**Goal:** Habit and shareable proof after each session.



| # | Feature | Depends on | Target |

|---|---|---|---|

| 2.1 | Post-game recap card (auto + share image) | 0.5, 1.5 | T1 |

| 2.2 | Court / venue info on session + Rally default venue | 0.4 | T1 |

| 2.3 | Payment handle in profile (Venmo/Zelle note, no processing) | Profile | T1 |

| 2.4 | Social proof on profile (streaks, badges, games hosted/played) | 0.5, 2.1 | T1 |



**Exit criteria:** Users share recap off-app; venue block answers "where / how much / when busy."



---



## Phase 3 — Host Tools



**Goal:** Hosts prefer Rally as their coordination home.



| # | Feature | Depends on | Target |

|---|---|---|---|

| 3.1 | Reuse last game + schedule next session | 1.1 | T1 |

| 3.2 | Nudge non-responders ("I'm in" reminders) | 1.1 | T1 |

| 3.3 | Invite previous players / Rally members | 0.3 | T1 |

| 3.4 | Auto-fill from public pool (Need Players hook) | 4.2 | T1 + T2 |



**Exit criteria:** Host completes weekly schedule in under 2 minutes.



---



## Phase 4 — Liquidity & Matching (Acquisition)



**Goal:** Players who cannot find others get matched to hosts and groups.



| # | Feature | Depends on | Target |

|---|---|---|---|

| 4.1 | Sport Captain program (recruit + onboard + feedback loop) | 0.1 | T2 |

| 4.2 | Need Players board (host posts open spots) | 1.1, 4.1 | T2 |

| 4.3 | Free Agent board (player posts availability) | 4.2 | T2 |

| 4.4 | Manual concierge matching (founder ops layer) | 4.2, 4.3 | T2 |

| 4.5 | City + sport landing pages (SEO / share links) | 4.1 | T2 |



**Exit criteria:** New stranger completes join → first session within 7 days in one sport vertical.



**Note:** Start captain recruitment in parallel with Phase 1 (relationships take longer than code). Ship boards after session cards are stable.



---



## Phase 5 — Partners & Seeding



**Goal:** Repeatable supply of games and courts.



| # | Feature | Depends on | Target |

|---|---|---|---|

| 5.1 | Venue partner profiles (courts, hours, booking links) | 2.2 | T2 |

| 5.2 | Coach / clinic partner listings | 5.1 | T2 |

| 5.3 | Seed Rally-hosted intro games (founder + captains) | 4.1, 4.2 | T2 |



**Exit criteria:** At least one venue and one coach actively posting or co-hosting in LA.



---



## Phase 6 — Sport-by-Sport Expansion



**Goal:** Template per sport; captains co-own rules and rollout.



| # | Feature | Depends on | Target |

|---|---|---|---|

| 6.1 | Sport config templates (roster size, rotation rules, tourney formats) | 1.3, 1.4 | T1 + T2 |

| 6.2 | Captain feedback → sport upgrade backlog | 4.1 | T2 |

| 6.3 | Second city after LA retention + liquidity proven | 4–5 | T2 |



**Defer until Phase 1–2 retention proven:** Teams, Leagues, in-app payments, public rankings, rich chat (stickers/audio/calls).



---



## Roadmap Timeline (Suggested)



| Quarter focus | Phases | North-star metric |

|---|---|---|

| Now | 0 → 1.1–1.3 | Sessions with lock + attendance per active Rally |

| Next | 1.4–1.5, 2.1–2.2 | % sessions using poll / rotation / tourney |

| Then | 3, 4.1–4.3 | New players matched to first game |

| Later | 4.4–5, 6 | Captains per sport; sport template coverage |



---



# Sport Captain Program — Incentive Structure



## Design Goal



**Do not split the group.** Everyone in a captain-linked Rally should feel they benefit from the program. The captain earns *recognition and leverage*, not exclusive perks that create a two-tier group.



Think: **Rally perks for the whole crew, captain gets the microphone and a little extra.**



---



## Three Layers of Benefits



### Layer 1 — Every Rally Member (default)



When a Rally is linked to an active captain chapter (city + sport):



| Benefit | Why |

|---|---|

| Early access to new play features (poll, rotation, tourney) | Group wins together when tools ship |

| Group badge on Rally ("Pasadena Badminton · Rally Partner") | Pride, not paywall |

| Shared recap + in-group leaderboard | Visible value for all |

| Priority support channel for *the group* (one thread, captain posts) | Trust stays in the open |

| Founding-member pricing lock when paid tiers launch | Reward early adopters as a unit |



**Rule:** Never ship a captain-only feature that regular members need to run a session (e.g. rotation generator must be group-wide).



---



### Layer 2 — Captain (slightly more)



Captains are **operators and feedback partners**, not royalty.



| Benefit | Why |

|---|---|

| **Captain badge** on profile + host line on Discover | Status without excluding members |

| **Host toolkit first** (nudge, reuse game, Need Players post) | They do the work |

| **Direct product feedback lane** (monthly 30-min sport call + async channel) | Sport-by-sport upgrades |

| **Co-marketing** ("Hosted by [Captain] · Pasadena Tuesday") | Helps them fill games |

| **Extra founder pricing** (e.g. group gets 20% off Pro; captain gets 30% or 1 free year) | Slightly more, not 10× |

| **Referral credit** for new *groups* they onboard (not per-user pyramid) | Align to bringing whole crews |

| **Featured on city + sport landing page** | Discovery help |



**Rule:** Captain extras = **host labor + feedback**, not gameplay advantage inside the group.



---



### Layer 3 — City Captain Network (many captains, not one)



You need **many captains per city**, segmented by sport and often by sub-market (Pasadena vs West LA).



| Role | Scope | Count (LA example) |

|---|---|---|

| Sport Captain | One sport vertical (badminton, pickleball, soccer…) | 2–4 per sport |

| Venue Captain (optional) | One recurring venue / open play | 1 per venue |

| Ambassador | Brings existing WhatsApp groups onto Rally | As many as convert |



**Why many:** Liquidity is local and sport-specific. One "LA captain" cannot serve badminton Tuesday and soccer Sunday.



---



## Feedback Loop (Sport-by-Sport Upgrades)



Captains are how you avoid building generic junk.



```text

Captain runs session → friction notes (48h)

↓

Monthly sport sync (30 min, all captains for that sport)

↓

Backlog: template tweaks (roster size, rotation rules, tourney format)

↓

Ship to ALL groups on that sport template + release notes in app

↓

Group badge updates ("Pickleball v2 rotation")

```



**Ask captains for:**



- Default roster size and waitlist behavior

- Rotation fairness rules

- Which tourney formats get used

- Venue fields that matter (parking vs cost vs booking)

- Wording that fits the sport ("court" vs "field" vs "gym")



**Give captains credit** in release notes when their sport template ships.



---



## What Not to Do



| Anti-pattern | Why it hurts |

|---|---|

| Captain-only rotation or tourney | Splits group; members stay on WhatsApp |

| Paid captain tier visible in group chat | Creates resentment |

| Single city captain | Bottleneck; wrong sport expertise |

| Paying captains cash early | Attracts mercenaries; use status + tools + pricing |

| Leaderboard that ranks members against strangers | OK in-group; not public shame |



---



## Simple Enrollment Flow



1. Captain applies (sport, city, typical weekly game, link to existing group if any).

2. Founder approves → links their Rally as **Partner Rally**.

3. **Whole Rally** gets Layer 1 benefits immediately.

4. Captain gets Layer 2 after first hosted session with attendance logged.

5. Captain joins sport feedback channel; monthly sync on calendar.



---



## Success Metrics



| Metric | Target |

|---|---|

| Partner Rallies with ≥1 session / week | Growing |

| % session tools used (poll / rotation / tourney) | >40% of locked sessions |

| Captain-sourced new groups / month | Primary acquisition channel |

| Time to first game for matched stranger | <7 days |

| Captain retention (still hosting at 90 days) | >70% |



---



## Recommended Incentive Copy (External)



**For members:** "Your Rally unlocked Rally Partner perks — early features, group badge, and founding pricing when Plus launches."



**For captains:** "You're the host — extra tools, featured listing, and a direct line to shape [sport] on Rally. Your whole group gets Partner perks with you."


