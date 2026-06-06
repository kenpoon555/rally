-- Phase 3.2 + 2.3: Host roster nudge + profile payment handle.

insert into public.app_feature_flags (key, enabled, config)
values ('nudge_v1', true, '{"description":"Host nudge non-ready roster"}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled;

-- ── Payment handle (profile) ────────────────────────────────────────────────

alter table public.profiles
  add column if not exists payment_note text,
  add column if not exists preferred_payment text
    check (
      preferred_payment is null
      or preferred_payment in ('venmo', 'zelle', 'cash', 'paypal', 'other')
    );

create or replace function public.set_profile_payment(
  p_payment_note text,
  p_preferred_payment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if p_preferred_payment is not null
    and p_preferred_payment not in ('venmo', 'zelle', 'cash', 'paypal', 'other') then
    raise exception 'Invalid payment method';
  end if;

  update public.profiles
  set
    payment_note = nullif(trim(p_payment_note), ''),
    preferred_payment = p_preferred_payment,
    updated_at = now()
  where id = v_user;
end;
$$;

create or replace function public.get_host_payment_hint(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_host record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Game not found';
  end if;

  if not (
    v_activity.user_id = v_user
    or exists (
      select 1 from public.join_requests jr
      where jr.activity_id = p_activity_id
        and jr.user_id = v_user
        and jr.status in ('approved', 'pending', 'waitlisted')
    )
    or (
      v_activity.regular_group_id is not null
      and public.is_regular_group_member(v_activity.regular_group_id, v_user)
    )
  ) then
    raise exception 'Not allowed';
  end if;

  select payment_note, preferred_payment, username
  into v_host
  from public.profiles
  where id = v_activity.user_id;

  if v_host.payment_note is null and v_host.preferred_payment is null then
    return null;
  end if;

  return jsonb_build_object(
    'payment_note', v_host.payment_note,
    'preferred_payment', v_host.preferred_payment,
    'host_username', v_host.username
  );
end;
$$;

-- ── Roster nudge ──────────────────────────────────────────────────────────────

create table if not exists public.activity_roster_nudges (
  activity_id uuid not null references public.activities(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  nudged_at timestamptz not null default now(),
  nudge_count int not null default 1,
  primary key (activity_id, host_id)
);

alter table public.activity_roster_nudges enable row level security;

drop policy if exists "Hosts view own nudges" on public.activity_roster_nudges;
create policy "Hosts view own nudges"
  on public.activity_roster_nudges for select
  using (host_id = auth.uid());

create or replace function public.nudge_session_roster(p_activity_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_conversation_id uuid;
  v_last_nudge timestamptz;
  v_count int := 0;
  v_court text;
  v_msg text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.app_feature_flags where key = 'nudge_v1' and enabled = true
  ) then
    raise exception 'Nudge is not enabled';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Game not found';
  end if;

  if v_activity.user_id <> v_user then
    raise exception 'Only the host can nudge';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Roster is already locked';
  end if;

  select nudged_at into v_last_nudge
  from public.activity_roster_nudges
  where activity_id = p_activity_id and host_id = v_user;

  if v_last_nudge is not null and v_last_nudge > now() - interval '24 hours' then
    raise exception 'You can nudge again in 24 hours';
  end if;

  select count(*)::int into v_count
  from public.join_requests jr
  where jr.activity_id = p_activity_id
    and jr.status = 'approved'
    and jr.ready_at is null;

  if v_count < 1 then
    raise exception 'Everyone on the roster has already tapped I''m in';
  end if;

  select coalesce(al.name, 'the game') into v_court
  from public.activity_locations al
  where al.id = v_activity.location_id;

  v_msg := 'Host is locking roster — tap I''m in to confirm for ' || v_court || '.';

  if v_activity.regular_group_id is not null then
    v_conversation_id := public.ensure_crew_conversation(v_activity.regular_group_id);
  else
    select c.id into v_conversation_id
    from public.conversations c
    where c.activity_id = p_activity_id
      and c.conversation_type = 'activity_group'
    limit 1;
  end if;

  if v_conversation_id is not null then
    insert into public.messages (conversation_id, sender_id, message_type, content, activity_id)
    values (v_conversation_id, v_user, 'system', v_msg, p_activity_id);
  end if;

  insert into public.activity_roster_nudges (activity_id, host_id, nudged_at, nudge_count)
  values (p_activity_id, v_user, now(), 1)
  on conflict (activity_id, host_id) do update
  set nudged_at = now(), nudge_count = activity_roster_nudges.nudge_count + 1;

  return v_count;
end;
$$;

revoke all on function public.set_profile_payment(text, text) from public;
grant execute on function public.set_profile_payment(text, text) to authenticated;

revoke all on function public.get_host_payment_hint(uuid) from public;
grant execute on function public.get_host_payment_hint(uuid) to authenticated;

revoke all on function public.nudge_session_roster(uuid) from public;
grant execute on function public.nudge_session_roster(uuid) to authenticated;
