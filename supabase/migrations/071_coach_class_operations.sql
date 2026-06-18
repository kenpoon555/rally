-- Coach class operations (v1.4): defer/cancel session state, parent notifications, audit.

create table if not exists public.coach_class_session_state (
  class_id text not null,
  coach_user_id uuid not null references public.profiles(id) on delete cascade,
  class_title text not null,
  sport_type text,
  scheduled_start timestamptz not null,
  effective_start timestamptz not null,
  duration_minutes integer not null default 90,
  session_status text not null default 'scheduled'
    check (session_status in ('scheduled', 'deferred', 'cancelled')),
  updated_at timestamptz not null default now(),
  primary key (class_id, coach_user_id)
);

create table if not exists public.class_parent_notifications (
  id uuid primary key default gen_random_uuid(),
  class_id text not null,
  coach_user_id uuid not null references public.profiles(id) on delete cascade,
  parent_user_id uuid not null references public.profiles(id) on delete cascade,
  student_profile_id uuid references public.student_profiles(id) on delete set null,
  operation text not null check (operation in ('defer', 'cancel', 'notify')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_class_parent_notifications_parent
  on public.class_parent_notifications(parent_user_id, created_at desc);

create table if not exists public.class_operation_audit (
  id uuid primary key default gen_random_uuid(),
  class_id text not null,
  coach_user_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.coach_class_session_state enable row level security;
alter table public.class_parent_notifications enable row level security;
alter table public.class_operation_audit enable row level security;

drop policy if exists "Coaches manage class session state" on public.coach_class_session_state;
create policy "Coaches manage class session state"
  on public.coach_class_session_state
  for all
  using (coach_user_id = auth.uid())
  with check (coach_user_id = auth.uid());

drop policy if exists "Coaches view class session state" on public.coach_class_session_state;
create policy "Coaches view class session state"
  on public.coach_class_session_state
  for select
  using (coach_user_id = auth.uid());

drop policy if exists "Parents view enrolled class session state" on public.coach_class_session_state;
create policy "Parents view enrolled class session state"
  on public.coach_class_session_state
  for select
  using (
    exists (
      select 1
      from public.student_enrollments e
      join public.student_profiles sp on sp.id = e.student_profile_id
      where e.class_id = coach_class_session_state.class_id
        and e.coach_user_id = coach_class_session_state.coach_user_id
        and e.status = 'active'
        and sp.parent_user_id = auth.uid()
    )
  );

drop policy if exists "Parents read own class notifications" on public.class_parent_notifications;
create policy "Parents read own class notifications"
  on public.class_parent_notifications
  for select
  using (parent_user_id = auth.uid());

drop policy if exists "Coaches read class operation audit" on public.class_operation_audit;
create policy "Coaches read class operation audit"
  on public.class_operation_audit
  for select
  using (coach_user_id = auth.uid());

create or replace function public.notify_enrolled_class_parents(
  p_class_id text,
  p_coach_user_id uuid,
  p_operation text,
  p_message text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_row record;
begin
  for v_row in
    select distinct sp.parent_user_id, e.student_profile_id
    from public.student_enrollments e
    join public.student_profiles sp on sp.id = e.student_profile_id
    where e.class_id = p_class_id
      and e.coach_user_id = p_coach_user_id
      and e.status = 'active'
  loop
    insert into public.class_parent_notifications (
      class_id, coach_user_id, parent_user_id, student_profile_id, operation, message
    )
    values (
      p_class_id, p_coach_user_id, v_row.parent_user_id, v_row.student_profile_id, p_operation, p_message
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.defer_coach_class_session(
  p_class_id text,
  p_class_title text,
  p_sport_type text,
  p_scheduled_start timestamptz,
  p_duration_minutes integer,
  p_notify_parents boolean default true
)
returns public.coach_class_session_state
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach uuid := auth.uid();
  v_deferred timestamptz;
  v_row public.coach_class_session_state;
  v_message text;
begin
  if v_coach is null then
    raise exception 'Authentication required';
  end if;

  v_deferred := p_scheduled_start + interval '7 days';

  insert into public.coach_class_session_state (
    class_id, coach_user_id, class_title, sport_type,
    scheduled_start, effective_start, duration_minutes, session_status, updated_at
  )
  values (
    p_class_id, v_coach, p_class_title, p_sport_type,
    p_scheduled_start, v_deferred, p_duration_minutes, 'deferred', now()
  )
  on conflict (class_id, coach_user_id) do update set
    class_title = excluded.class_title,
    sport_type = excluded.sport_type,
    scheduled_start = excluded.scheduled_start,
    effective_start = excluded.effective_start,
    duration_minutes = excluded.duration_minutes,
    session_status = 'deferred',
    updated_at = now()
  returning * into v_row;

  insert into public.class_operation_audit (class_id, coach_user_id, operation, payload)
  values (
    p_class_id, v_coach, 'defer',
    jsonb_build_object('effective_start', v_deferred, 'notify_parents', p_notify_parents)
  );

  if p_notify_parents then
    v_message := format(
      '%s is deferred to %s. Your child''s enrollment is unchanged.',
      p_class_title,
      to_char(v_deferred at time zone 'America/Los_Angeles', 'Dy, Mon DD · HH12:MI AM')
    );
    perform public.notify_enrolled_class_parents(p_class_id, v_coach, 'defer', v_message);
  end if;

  return v_row;
end;
$$;

create or replace function public.cancel_coach_class_session(
  p_class_id text,
  p_class_title text,
  p_sport_type text,
  p_scheduled_start timestamptz,
  p_duration_minutes integer,
  p_notify_parents boolean default true
)
returns public.coach_class_session_state
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach uuid := auth.uid();
  v_row public.coach_class_session_state;
  v_message text;
begin
  if v_coach is null then
    raise exception 'Authentication required';
  end if;

  insert into public.coach_class_session_state (
    class_id, coach_user_id, class_title, sport_type,
    scheduled_start, effective_start, duration_minutes, session_status, updated_at
  )
  values (
    p_class_id, v_coach, p_class_title, p_sport_type,
    p_scheduled_start, p_scheduled_start, p_duration_minutes, 'cancelled', now()
  )
  on conflict (class_id, coach_user_id) do update set
    class_title = excluded.class_title,
    sport_type = excluded.sport_type,
    scheduled_start = excluded.scheduled_start,
    effective_start = excluded.effective_start,
    duration_minutes = excluded.duration_minutes,
    session_status = 'cancelled',
    updated_at = now()
  returning * into v_row;

  insert into public.class_operation_audit (class_id, coach_user_id, operation, payload)
  values (
    p_class_id, v_coach, 'cancel',
    jsonb_build_object('notify_parents', p_notify_parents)
  );

  if p_notify_parents then
    v_message := format('%s on %s is cancelled. We will follow up if it is rescheduled.',
      p_class_title,
      to_char(p_scheduled_start at time zone 'America/Los_Angeles', 'Dy, Mon DD')
    );
    perform public.notify_enrolled_class_parents(p_class_id, v_coach, 'cancel', v_message);
  end if;

  return v_row;
end;
$$;

grant execute on function public.defer_coach_class_session(text, text, text, timestamptz, integer, boolean) to authenticated;
grant execute on function public.cancel_coach_class_session(text, text, text, timestamptz, integer, boolean) to authenticated;

insert into public.app_feature_flags (key, enabled, config)
values
  ('coach_class_operations_v1', false, '{"description":"Coach defer/cancel class sessions"}'::jsonb)
on conflict (key) do nothing;
