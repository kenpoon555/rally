# Founder checklist (beta)

**Strategy:** [vision.md](./vision.md) · **QA:** [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md)

| # | Task | Done |
|---|------|------|
| 1 | Recruit 5–10 LA hosts (badminton / pickleball / basketball) with **labeled** listings | ☐ |
| 2 | Run replay SQL on Supabase (below) — screenshot | ☐ |
| 3 | Send hosts preview install link + 3-step script (create → Rally chat → lock) | ☐ |
| 4 | Designer: lock v1.0 screen list (Today, Play, Game room, Rally chat, Profile) | ☐ |
| 5 | Read beta feedback in **Profile → Admin** weekly | ☐ |
| 6 | One real game on preview yourself (I'm in → lock → attendance) | ☐ |

## Replay SQL (north star)

```sql
select
  count(*) filter (where retained >= 1) as crews_with_replay,
  count(*) as total_crews,
  round(100.0 * count(*) filter (where retained >= 1) / nullif(count(*), 0), 1) as replay_pct
from analytics_crew_lifecycle;
```

If `total_crews = 0`, prioritize host recruitment (#1).
