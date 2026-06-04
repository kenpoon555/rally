-- 026: Crew retention funnel
--
-- Beta goal is to prove the core free loop retains before building paid tiers
-- (Organizer Pro / Player Plus / Leagues). These views surface the Regulars
-- ("crew") funnel from the product_events stream:
--   regular_group_created -> crew_invite_redeemed -> crew_replayed
--
-- No new tables: events are written via track_product_event() from the client.
-- Query with the service role or the SQL editor.

-- Rolling 30-day crew funnel (wider window than analytics_funnel_7d because
-- replays happen on a weekly-or-slower cadence).
create or replace view public.analytics_crew_funnel_30d as
select
  event_name,
  count(*) as event_count,
  count(distinct user_id) as unique_users,
  count(distinct (properties->>'group_id')) as unique_groups
from public.product_events
where created_at > now() - interval '30 days'
  and event_name in ('regular_group_created', 'crew_invite_redeemed', 'crew_replayed')
group by event_name
order by event_count desc;

-- Per-group lifecycle: when a crew formed, how many invites it redeemed, and
-- how many times it replayed. A group with replay_count >= 1 is "retained".
create or replace view public.analytics_crew_lifecycle as
with created as (
  select
    (properties->>'group_id') as group_id,
    min(created_at) as created_at
  from public.product_events
  where event_name = 'regular_group_created'
    and properties ? 'group_id'
  group by 1
),
invites as (
  select (properties->>'group_id') as group_id, count(*) as invite_redeemed
  from public.product_events
  where event_name = 'crew_invite_redeemed'
    and properties ? 'group_id'
  group by 1
),
replays as (
  select
    (properties->>'group_id') as group_id,
    count(*) as replay_count,
    max(created_at) as last_replay_at
  from public.product_events
  where event_name = 'crew_replayed'
    and properties ? 'group_id'
  group by 1
)
select
  c.group_id,
  c.created_at,
  coalesce(i.invite_redeemed, 0) as invite_redeemed,
  coalesce(r.replay_count, 0) as replay_count,
  r.last_replay_at,
  (coalesce(r.replay_count, 0) > 0) as retained
from created c
left join invites i on i.group_id = c.group_id
left join replays r on r.group_id = c.group_id
order by c.created_at desc;

grant select on public.analytics_crew_funnel_30d to authenticated;
grant select on public.analytics_crew_lifecycle to authenticated;
