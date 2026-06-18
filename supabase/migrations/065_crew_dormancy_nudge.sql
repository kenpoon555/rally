-- Crew dormancy nudge: host-only push when Rally has no upcoming game for N days.

insert into public.app_feature_flags (key, enabled, config)
values (
  'crew_dormancy_nudge_v1',
  true,
  '{"dormancy_days":14,"cooldown_days":14,"allow_dev_skip":true}'::jsonb
)
on conflict (key) do update
set
  enabled = excluded.enabled,
  config = excluded.config;

create table if not exists public.crew_dormancy_nudges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.regular_groups(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  sent_at timestamptz not null default now()
);

create index if not exists idx_crew_dormancy_nudges_group_sent
  on public.crew_dormancy_nudges(group_id, sent_at desc);

alter table public.crew_dormancy_nudges enable row level security;

create policy "Hosts view their crew dormancy nudges"
  on public.crew_dormancy_nudges for select
  using (
    host_id = auth.uid()
    or exists (
      select 1
      from public.regular_groups rg
      where rg.id = crew_dormancy_nudges.group_id
        and rg.host_id = auth.uid()
    )
  );

create or replace function public.crew_dormancy_nudge_config()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select config from public.app_feature_flags where key = 'crew_dormancy_nudge_v1' and enabled),
    '{"dormancy_days":14,"cooldown_days":14}'::jsonb
  );
$$;

create or replace function public.crew_has_upcoming_rally_game(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.activities a
    where a.regular_group_id = p_group_id
      and a.start_time > now()
  );
$$;

create or replace function public.crew_last_rally_game_at(p_group_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select max(a.start_time)
  from public.activities a
  where a.regular_group_id = p_group_id;
$$;

create or replace function public.crew_dormancy_nudge_in_cooldown(p_group_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cooldown_days int := coalesce((public.crew_dormancy_nudge_config()->>'cooldown_days')::int, 14);
begin
  return exists (
    select 1
    from public.crew_dormancy_nudges n
    where n.group_id = p_group_id
      and n.sent_at > now() - make_interval(days => v_cooldown_days)
  );
end;
$$;

create or replace function public.is_crew_dormant_for_nudge(p_group_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_dormancy_days int := coalesce((public.crew_dormancy_nudge_config()->>'dormancy_days')::int, 14);
  v_last_game timestamptz;
  v_created timestamptz;
begin
  if public.crew_has_upcoming_rally_game(p_group_id) then
    return false;
  end if;

  v_last_game := public.crew_last_rally_game_at(p_group_id);

  if v_last_game is not null then
    return v_last_game < now() - make_interval(days => v_dormancy_days);
  end if;

  select rg.created_at into v_created
  from public.regular_groups rg
  where rg.id = p_group_id;

  return coalesce(v_created, now()) < now() - make_interval(days => v_dormancy_days);
end;
$$;

create or replace function public.claim_crew_dormancy_nudge(
  p_group_id uuid,
  p_skip_eligibility boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_group public.regular_groups%rowtype;
  v_allow_dev_skip boolean := coalesce(
    (public.crew_dormancy_nudge_config()->>'allow_dev_skip')::boolean,
    false
  );
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_group
  from public.regular_groups
  where id = p_group_id;

  if v_group.id is null then
    raise exception 'Rally not found';
  end if;

  if v_group.host_id <> v_user then
    raise exception 'Only the Rally host can send dormancy nudges';
  end if;

  if not exists (
    select 1
    from public.app_feature_flags
    where key = 'crew_dormancy_nudge_v1'
      and enabled
  ) then
    raise exception 'Crew dormancy nudge is disabled';
  end if;

  if p_skip_eligibility then
    if not v_allow_dev_skip then
      raise exception 'Dev skip is not enabled';
    end if;
  else
    if public.crew_has_upcoming_rally_game(p_group_id) then
      raise exception 'Rally has an upcoming game';
    end if;

    if not public.is_crew_dormant_for_nudge(p_group_id) then
      raise exception 'Rally is not dormant yet';
    end if;

    if public.crew_dormancy_nudge_in_cooldown(p_group_id) then
      raise exception 'Dormancy nudge cooldown active';
    end if;
  end if;

  insert into public.crew_dormancy_nudges (group_id, host_id)
  values (p_group_id, v_group.host_id);

  return jsonb_build_object(
    'ok', true,
    'group_id', p_group_id,
    'group_name', v_group.name,
    'host_id', v_group.host_id
  );
end;
$$;

create or replace function public.list_crews_for_dormancy_nudge()
returns table (
  group_id uuid,
  host_id uuid,
  group_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.app_feature_flags
    where key = 'crew_dormancy_nudge_v1'
      and enabled
  ) then
    return;
  end if;

  return query
  select rg.id, rg.host_id, rg.name
  from public.regular_groups rg
  where public.is_crew_dormant_for_nudge(rg.id)
    and not public.crew_dormancy_nudge_in_cooldown(rg.id);
end;
$$;

grant execute on function public.claim_crew_dormancy_nudge(uuid, boolean) to authenticated;
grant execute on function public.list_crews_for_dormancy_nudge() to service_role;

create or replace function public.process_crew_dormancy_nudges_batch()
returns table (
  group_id uuid,
  host_id uuid,
  group_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  if not exists (
    select 1
    from public.app_feature_flags
    where key = 'crew_dormancy_nudge_v1'
      and enabled
  ) then
    return;
  end if;

  for v_row in
    select rg.id, rg.host_id, rg.name
    from public.regular_groups rg
    where public.is_crew_dormant_for_nudge(rg.id)
      and not public.crew_dormancy_nudge_in_cooldown(rg.id)
  loop
    insert into public.crew_dormancy_nudges (group_id, host_id)
    values (v_row.id, v_row.host_id);

    group_id := v_row.id;
    host_id := v_row.host_id;
    group_name := v_row.name;
    return next;
  end loop;
end;
$$;

grant execute on function public.process_crew_dormancy_nudges_batch() to service_role;
