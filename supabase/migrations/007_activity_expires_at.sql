-- Activity listing expiry: default equals scheduled start; host can extend (also moves start_time).

alter table public.activities
  add column if not exists expires_at timestamptz;

-- Backfill: fixed games expire at start_time; flex at window_end or start_time + 3h.
update public.activities
set expires_at = coalesce(
  case when scheduling_mode = 'flex' then window_end else null end,
  start_time
)
where expires_at is null;

create index if not exists idx_activities_expires_at on public.activities (expires_at)
where status = 'active';
