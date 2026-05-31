-- Break activities <-> join_requests RLS recursion (same pattern as conversation_members fix).

create or replace function public.is_activity_host(p_activity_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.activities a
    where a.id = p_activity_id
      and a.user_id = auth.uid()
  );
$$;

create or replace function public.user_has_approved_join(
  p_activity_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.join_requests jr
    where jr.activity_id = p_activity_id
      and jr.user_id = p_user_id
      and jr.status = 'approved'
  );
$$;

revoke all on function public.is_activity_host(uuid) from public;
grant execute on function public.is_activity_host(uuid) to authenticated;

revoke all on function public.user_has_approved_join(uuid, uuid) from public;
grant execute on function public.user_has_approved_join(uuid, uuid) to authenticated;

drop policy if exists "Anyone can view active activities" on public.activities;
create policy "Anyone can view active activities"
  on public.activities
  for select
  using (
    status = 'active'
    or user_id = auth.uid()
    or public.user_has_approved_join(id, auth.uid())
  );

drop policy if exists "Users can view join requests for their activities" on public.join_requests;
create policy "Users can view join requests for their activities"
  on public.join_requests
  for select
  using (
    public.is_activity_host(activity_id)
    or user_id = auth.uid()
  );

drop policy if exists "Activity hosts can update join requests" on public.join_requests;
create policy "Activity hosts can update join requests"
  on public.join_requests
  for update
  using (public.is_activity_host(activity_id));

-- Max 3 upcoming joins; block overlapping game times.
create or replace function public.assert_user_can_join_activity(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_target record;
  v_future_count integer;
  v_target_end timestamptz;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_target
  from public.activities
  where id = p_activity_id;

  if not found then
    raise exception 'Activity not found';
  end if;

  if v_target.user_id = v_user then
    return;
  end if;

  if v_target.status <> 'active' then
    raise exception 'This game is no longer open to join.';
  end if;

  v_target_end := v_target.start_time + make_interval(mins => coalesce(v_target.duration, 60));

  select count(*)
  into v_future_count
  from public.join_requests jr
  inner join public.activities a on a.id = jr.activity_id
  where jr.user_id = v_user
    and jr.status in ('pending', 'approved')
    and a.status = 'active'
    and a.start_time > now()
    and jr.activity_id <> p_activity_id;

  if v_future_count >= 3 then
    raise exception 'You can only join up to 3 upcoming games at a time.';
  end if;

  if exists (
    select 1
    from public.join_requests jr
    inner join public.activities a on a.id = jr.activity_id
    where jr.user_id = v_user
      and jr.status in ('pending', 'approved')
      and a.status = 'active'
      and jr.activity_id <> p_activity_id
      and tstzrange(a.start_time, a.start_time + make_interval(mins => coalesce(a.duration, 60)), '[)')
          && tstzrange(v_target.start_time, v_target_end, '[)')
  ) then
    raise exception 'This game overlaps with another game you already joined or requested.';
  end if;
end;
$$;

revoke all on function public.assert_user_can_join_activity(uuid) from public;
grant execute on function public.assert_user_can_join_activity(uuid) to authenticated;
