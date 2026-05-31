-- Stage 1: Trust & safety — blocks, reports, no-shows, profile safety fields.

alter table public.profiles
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists push_quiet_hours_start smallint
    check (push_quiet_hours_start is null or (push_quiet_hours_start >= 0 and push_quiet_hours_start <= 23)),
  add column if not exists push_quiet_hours_end smallint
    check (push_quiet_hours_end is null or (push_quiet_hours_end >= 0 and push_quiet_hours_end <= 23));

create table if not exists public.user_blocks (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists idx_user_blocks_blocker on public.user_blocks(blocker_id);
create index if not exists idx_user_blocks_blocked on public.user_blocks(blocked_id);

create table if not exists public.user_reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('harassment', 'spam', 'unsafe_behavior', 'no_show', 'other')),
  detail text,
  context_type text check (context_type in ('profile', 'activity', 'chat', 'other')),
  context_id uuid,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create index if not exists idx_user_reports_reporter on public.user_reports(reporter_id);
create index if not exists idx_user_reports_reported on public.user_reports(reported_id);
create index if not exists idx_user_reports_status on public.user_reports(status);

create table if not exists public.activity_no_shows (
  id uuid primary key default uuid_generate_v4(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (activity_id, reported_user_id, reporter_id),
  check (reported_user_id <> reporter_id)
);

create index if not exists idx_activity_no_shows_activity on public.activity_no_shows(activity_id);
create index if not exists idx_activity_no_shows_reported on public.activity_no_shows(reported_user_id);

-- Returns true if either user has blocked the other.
create or replace function public.users_are_blocked(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_blocks ub
    where (ub.blocker_id = user_a and ub.blocked_id = user_b)
       or (ub.blocker_id = user_b and ub.blocked_id = user_a)
  );
$$;

alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;
alter table public.activity_no_shows enable row level security;

drop policy if exists "Users manage own blocks" on public.user_blocks;
create policy "Users manage own blocks"
  on public.user_blocks
  for all
  using (blocker_id = auth.uid() or blocked_id = auth.uid())
  with check (blocker_id = auth.uid());

drop policy if exists "Users create reports as self" on public.user_reports;
create policy "Users create reports as self"
  on public.user_reports
  for insert
  with check (reporter_id = auth.uid());

drop policy if exists "Users view own reports" on public.user_reports;
create policy "Users view own reports"
  on public.user_reports
  for select
  using (reporter_id = auth.uid());

drop policy if exists "Users record no-shows as self" on public.activity_no_shows;
create policy "Users record no-shows as self"
  on public.activity_no_shows
  for insert
  with check (reporter_id = auth.uid());

drop policy if exists "Users view no-shows they filed or on their activities" on public.activity_no_shows;
create policy "Users view no-shows they filed or on their activities"
  on public.activity_no_shows
  for select
  using (
    reporter_id = auth.uid()
    or exists (
      select 1 from public.activities a
      where a.id = activity_no_shows.activity_id and a.user_id = auth.uid()
    )
  );
