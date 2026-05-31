# Stage 2 — Cost Control + Liquidity Instrumentation (complete)

## Shipped

### Rate limits (feature-flagged, UTC daily)

| Metric | Flag key | Default limit |
|--------|----------|---------------|
| Discovery search | `rate_limit_discovery` | 300/day |
| Chat messages | `rate_limit_chat_message` | 500/day |
| Push dispatch (caller) | `rate_limit_push_send` | 40/day |
| New conversations | `rate_limit_chat_create` | 20/day |

Tune in `app_feature_flags.config` without deploy. Set `enabled: false` to disable a limit.

### Analytics

- `product_events` + `track_product_event` RPC
- Events: `discover_refreshed`, `join_request_created`, `join_request_approved`, `message_sent`, `conversation_opened`, `game_hosted`, `activity_chat_opened`, `no_show_reported`, `repeat_game_detected`, `friend_connection_made`
- `discover_refreshed` includes `has_prior_game` for retention signal
- Views: `analytics_funnel_7d`, `analytics_usage_7d` (readable by authenticated; use SQL editor for cohort analysis)

### Cost controls

- Profile photo **URL validation** (https + allowed hosts + length cap)
- `utils/imageUpload.ts` — size/dimension limits ready for storage upload
- Discover banner when search limit hit

## Migrations

- `009_stage2_cost_metrics.sql`
- `010_stage1_2_finish.sql` (`chat_create` limit + analytics views)

## Funnel SQL (Supabase SQL editor)

```sql
select * from public.analytics_funnel_7d;
select * from public.analytics_usage_7d;
```

```sql
-- Match → chat → game (7d unique users per step)
select event_name, count(distinct user_id) as users
from public.product_events
where created_at > now() - interval '7 days'
  and event_name in (
    'join_request_created',
    'conversation_opened',
    'join_request_approved',
    'repeat_game_detected'
  )
group by event_name;
```

## Deferred (post-Stage 2 / scale)

- Geohash/H3 + search result caching
- Notification batching queue
- In-app cohort dashboard (data is in `product_events` / views)
- Native image picker + compression pipeline (constants in `imageUpload.ts`)

## Redeploy push

```bash
supabase functions deploy send-push --project-ref casljueycxsqexpkdiuq
```
