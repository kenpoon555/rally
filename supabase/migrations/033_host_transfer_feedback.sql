-- Host transfer on exit, beta product feedback, admin read RPC.

-- ---------------------------------------------------------------------------
-- Beta feedback
-- ---------------------------------------------------------------------------
create table if not exists public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  screen text,
  activity_id uuid references public.activities(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_feedback_created
  on public.product_feedback(created_at desc);

alter table public.product_feedback enable row level security;

drop policy if exists "Users insert own feedback" on public.product_feedback;
create policy "Users insert own feedback"
  on public.product_feedback
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users read own feedback" on public.product_feedback;
create policy "Users read own feedback"
  on public.product_feedback
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins read all feedback" on public.product_feedback;
create policy "Admins read all feedback"
  on public.product_feedback
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and coalesce(p.is_admin, false)
    )
  );

create or replace function public.submit_product_feedback(
  p_body text,
  p_screen text default null,
  p_activity_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_body text := trim(coalesce(p_body, ''));
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if char_length(v_body) < 1 then
    raise exception 'Feedback cannot be empty';
  end if;
  if char_length(v_body) > 4000 then
    raise exception 'Feedback is too long (max 4000 characters)';
  end if;

  insert into public.product_feedback (user_id, body, screen, activity_id)
  values (v_user, v_body, nullif(trim(p_screen), ''), p_activity_id)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_product_feedback(text, text, uuid) from public;
grant execute on function public.submit_product_feedback(text, text, uuid) to authenticated;

create or replace function public.admin_list_product_feedback(p_limit int default 50)
returns table (
  id uuid,
  user_id uuid,
  username text,
  body text,
  screen text,
  activity_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and coalesce(p.is_admin, false)
  ) then
    raise exception 'Admin only';
  end if;

  return query
  select
    f.id,
    f.user_id,
    pr.username,
    f.body,
    f.screen,
    f.activity_id,
    f.created_at
  from public.product_feedback f
  join public.profiles pr on pr.id = f.user_id
  order by f.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

revoke all on function public.admin_list_product_feedback(int) from public;
grant execute on function public.admin_list_product_feedback(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Host exits → transfer to next player (ready first, then earliest join)
-- ---------------------------------------------------------------------------
create or replace function public.host_transfer_and_exit(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_next record;
  v_conversation_id uuid;
  v_new_host_username text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity
  from public.activities
  where id = p_activity_id
  for update;

  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id <> v_user then
    raise exception 'Only the host can transfer and exit';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Cannot transfer host after the roster is locked';
  end if;

  if v_activity.status <> 'active' then
    raise exception 'Activity is not active';
  end if;

  select jr.*
  into v_next
  from public.join_requests jr
  where jr.activity_id = p_activity_id
    and jr.status = 'approved'
  order by (jr.ready_at is not null) desc, jr.requested_at asc
  limit 1;

  if not found then
    update public.activities
    set status = 'cancelled', updated_at = now()
    where id = p_activity_id;

    select c.id into v_conversation_id
    from public.conversations c
    where c.activity_id = p_activity_id
      and c.conversation_type = 'activity_group'
    limit 1;

    if v_conversation_id is not null then
      update public.conversation_members
      set is_active = false
      where conversation_id = v_conversation_id;
    end if;

    return jsonb_build_object('cancelled', true, 'new_host_id', null);
  end if;

  select pr.username into v_new_host_username
  from public.profiles pr
  where pr.id = v_next.user_id;

  delete from public.join_requests
  where activity_id = p_activity_id
    and user_id = v_next.user_id;

  update public.activities
  set user_id = v_next.user_id, updated_at = now()
  where id = p_activity_id;

  select c.id into v_conversation_id
  from public.conversations c
  where c.activity_id = p_activity_id
    and c.conversation_type = 'activity_group'
  limit 1;

  if v_conversation_id is not null then
    update public.conversation_members
    set role = 'member', is_active = false
    where conversation_id = v_conversation_id
      and user_id = v_user;

    insert into public.conversation_members (conversation_id, user_id, role, is_active)
    values (v_conversation_id, v_next.user_id, 'host', true)
    on conflict (conversation_id, user_id)
    do update set role = 'host', is_active = true;
  end if;

  perform public.ensure_activity_group_conversation(p_activity_id);

  return jsonb_build_object(
    'cancelled', false,
    'new_host_id', v_next.user_id,
    'new_host_username', v_new_host_username
  );
end;
$$;

revoke all on function public.host_transfer_and_exit(uuid) from public;
grant execute on function public.host_transfer_and_exit(uuid) to authenticated;
