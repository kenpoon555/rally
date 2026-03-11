-- Phase 6 / V2.1 foundation:
-- Flexible activity matching with participant preference collection and finalization.

-- 1) Extend activities for flexible scheduling lifecycle.
alter table public.activities
  add column if not exists scheduling_mode text not null default 'fixed'
    check (scheduling_mode in ('fixed', 'flex')),
  add column if not exists preference_deadline timestamptz,
  add column if not exists window_start timestamptz,
  add column if not exists window_end timestamptz,
  add column if not exists match_status text not null default 'open'
    check (match_status in ('open', 'collecting', 'finalized', 'cancelled')),
  add column if not exists finalized_at timestamptz,
  add column if not exists finalized_by uuid references public.profiles(id) on delete set null;

-- 2) Candidate locations for host-provided options.
create table if not exists public.activity_candidate_locations (
  id uuid primary key default uuid_generate_v4(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  location_id uuid not null references public.activity_locations(id) on delete cascade,
  priority_order integer not null default 1,
  created_at timestamptz not null default now(),
  unique (activity_id, location_id)
);

create index if not exists idx_activity_candidate_locations_activity_id
  on public.activity_candidate_locations(activity_id);

create index if not exists idx_activity_candidate_locations_location_id
  on public.activity_candidate_locations(location_id);

-- 3) Preferences submitted by each participant.
create table if not exists public.activity_participant_preferences (
  id uuid primary key default uuid_generate_v4(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  earliest_start timestamptz,
  latest_start timestamptz,
  preferred_duration integer,
  preferred_location_id uuid references public.activity_locations(id) on delete set null,
  availability_weight smallint not null default 3
    check (availability_weight between 1 and 5),
  notes text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create index if not exists idx_activity_participant_preferences_activity_id
  on public.activity_participant_preferences(activity_id);

create index if not exists idx_activity_participant_preferences_user_id
  on public.activity_participant_preferences(user_id);

-- 4) Keep updated_at synchronized on preference updates.
create or replace function public.touch_activity_participant_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_activity_participant_preferences_updated_at
  on public.activity_participant_preferences;

create trigger trg_touch_activity_participant_preferences_updated_at
before update on public.activity_participant_preferences
for each row execute procedure public.touch_activity_participant_preferences_updated_at();

-- 5) Enable RLS on new tables.
alter table public.activity_candidate_locations enable row level security;
alter table public.activity_participant_preferences enable row level security;

-- Candidate location policies.
drop policy if exists "Users can view candidate locations for visible activities"
  on public.activity_candidate_locations;
create policy "Users can view candidate locations for visible activities"
  on public.activity_candidate_locations
  for select
  using (
    exists (
      select 1
      from public.activities a
      where a.id = activity_candidate_locations.activity_id
        and (a.status = 'active' or a.user_id = auth.uid())
    )
  );

drop policy if exists "Hosts can manage candidate locations"
  on public.activity_candidate_locations;
create policy "Hosts can manage candidate locations"
  on public.activity_candidate_locations
  for all
  using (
    exists (
      select 1
      from public.activities a
      where a.id = activity_candidate_locations.activity_id
        and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.activities a
      where a.id = activity_candidate_locations.activity_id
        and a.user_id = auth.uid()
    )
  );

-- Participant preference policies.
drop policy if exists "Users can view preferences for joined or owned activities"
  on public.activity_participant_preferences;
create policy "Users can view preferences for joined or owned activities"
  on public.activity_participant_preferences
  for select
  using (
    exists (
      select 1
      from public.activities a
      where a.id = activity_participant_preferences.activity_id
        and a.user_id = auth.uid()
    )
    or activity_participant_preferences.user_id = auth.uid()
    or exists (
      select 1
      from public.join_requests jr
      where jr.activity_id = activity_participant_preferences.activity_id
        and jr.user_id = auth.uid()
        and jr.status in ('pending', 'approved')
    )
  );

drop policy if exists "Users can submit own preferences"
  on public.activity_participant_preferences;
create policy "Users can submit own preferences"
  on public.activity_participant_preferences
  for insert
  with check (
    user_id = auth.uid()
    and (
      exists (
        select 1
        from public.activities a
        where a.id = activity_participant_preferences.activity_id
          and a.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.join_requests jr
        where jr.activity_id = activity_participant_preferences.activity_id
          and jr.user_id = auth.uid()
          and jr.status in ('pending', 'approved')
      )
    )
  );

drop policy if exists "Users can update own preferences"
  on public.activity_participant_preferences;
create policy "Users can update own preferences"
  on public.activity_participant_preferences
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own preferences"
  on public.activity_participant_preferences;
create policy "Users can delete own preferences"
  on public.activity_participant_preferences
  for delete
  using (user_id = auth.uid());

-- 6) Finalization RPC:
-- Chooses a final location and start_time using submitted preferences,
-- and marks the activity as finalized.
create or replace function public.finalize_activity_best_slot(
  target_activity_id uuid,
  fallback_location_id uuid default null
)
returns table (
  final_start_time timestamptz,
  final_location_id uuid,
  matched_participants integer,
  score numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity record;
  v_host_id uuid;
  v_location_id uuid;
  v_start_time timestamptz;
  v_overlap_start timestamptz;
  v_overlap_end timestamptz;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_participants integer;
begin
  select a.*
  into v_activity
  from public.activities a
  where a.id = target_activity_id;

  if not found then
    raise exception 'Activity not found';
  end if;

  v_host_id := v_activity.user_id;
  if v_host_id <> auth.uid() then
    raise exception 'Only host can finalize this activity';
  end if;

  v_window_start := coalesce(v_activity.window_start, v_activity.start_time);
  v_window_end := coalesce(v_activity.window_end, v_activity.start_time + make_interval(mins => v_activity.duration));

  -- Most preferred candidate location among preferences, then fallback choices.
  select app.preferred_location_id
  into v_location_id
  from public.activity_participant_preferences app
  where app.activity_id = target_activity_id
    and app.preferred_location_id is not null
  group by app.preferred_location_id
  order by count(*) desc
  limit 1;

  if v_location_id is null then
    select acl.location_id
    into v_location_id
    from public.activity_candidate_locations acl
    where acl.activity_id = target_activity_id
    order by acl.priority_order asc, acl.created_at asc
    limit 1;
  end if;

  if v_location_id is null then
    v_location_id := coalesce(fallback_location_id, v_activity.location_id);
  end if;

  -- Preference overlap window.
  select
    max(coalesce(app.earliest_start, v_window_start)),
    min(coalesce(app.latest_start, v_window_end))
  into v_overlap_start, v_overlap_end
  from public.activity_participant_preferences app
  where app.activity_id = target_activity_id;

  if v_overlap_start is not null and v_overlap_end is not null and v_overlap_start <= v_overlap_end then
    v_start_time := v_overlap_start + ((v_overlap_end - v_overlap_start) / 2);
  else
    v_start_time := v_window_start;
  end if;

  -- Participant count includes host + approved joiners.
  select 1 + count(*)
  into v_participants
  from public.join_requests jr
  where jr.activity_id = target_activity_id
    and jr.status = 'approved';

  update public.activities
  set
    scheduling_mode = 'flex',
    match_status = 'finalized',
    finalized_at = now(),
    finalized_by = auth.uid(),
    start_time = coalesce(v_start_time, start_time),
    location_id = coalesce(v_location_id, location_id),
    updated_at = now()
  where id = target_activity_id;

  return query
  select
    coalesce(v_start_time, v_activity.start_time),
    v_location_id,
    coalesce(v_participants, 1),
    coalesce(v_participants, 1)::numeric;
end;
$$;
