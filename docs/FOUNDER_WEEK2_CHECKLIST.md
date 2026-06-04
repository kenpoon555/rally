# Founder Week 2 checklist (preview built · QA skipped)

**Assumption:** Preview build is on testers’ phones. Engineering continues; **you** run product + data work below.

---

## What only you can do (not the agent)

| # | Task | Time | Done |
|---|------|------|------|
| 1 | **Recruit 3–5 LA hosts** (badminton/pickleball) — names in a sheet | 2–3 hrs | ☐ |
| 2 | **Run replay SQL** on Supabase (below) — screenshot result | 15 min | ☐ |
| 3 | **Send hosts** install link + 3-step script: create game → Rally chat → lock → play | 30 min | ☐ |
| 4 | **Designer:** lock v1.0 screen list (Home, Discover, Game Room, Rally chat, Profile) | meeting | ☐ |
| 5 | **Read beta feedback** in Admin weekly; tag bug/ux/feature | 30 min/wk | ☐ |
| 6 | **One real game** on preview yourself (exit / pass host / feedback) | 30 min | ☐ |

---

## Replay metric SQL (north star)

```sql
select *
from analytics_crew_lifecycle
order by retained desc nulls last
limit 20;
```

```sql
select
  count(*) filter (where retained >= 1) as crews_with_replay,
  count(*) as total_crews,
  round(100.0 * count(*) filter (where retained >= 1) / nullif(count(*), 0), 1) as replay_pct
from analytics_crew_lifecycle;
```

If `total_crews = 0`, hosts have not created Rallys yet — prioritize recruitment (#1).

---

## Trust / abuse preview SQL (manual, no punishment bot)

```sql
select user_id, flake_count, no_show_count
from (
  select
    (get_profile_trust_stats(p.id)->>'flake_count')::int as flake_count,
    (get_profile_trust_stats(p.id)->>'no_show_count')::int as no_show_count,
    p.id as user_id,
    p.username
  from profiles p
) t
order by flake_count desc, no_show_count desc
limit 20;
```

---

## Engineering Week 2 (agent / eng)

| Item | Status |
|------|--------|
| Migration **033** (feedback + host transfer) | Apply on linked Supabase |
| Game room **Exit** + host **pass host** (ready → join time) | Shipped |
| Roster sort: I'm in first, join time asc | Shipped |
| Beta **feedback** screen + Admin list | Shipped |
| Pick **one** P2 slice next sprint | Guests **or** Discover — your call |

---

## QA note

Formal QA was delegated/skipped for speed. **You** are the smoke test: use [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md) §8.4–8.7 only if something breaks in the field.

---

## Decision after Week 2

```text
replay_pct healthy OR strong host signal?
  yes → start ONE P2 eng track (Guests or Discover)
  no  → more LA hosts, no new product scope
```
