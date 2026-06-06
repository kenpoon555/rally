-- Admin platform metrics (read-only) + leave_game: waitlisted exit + flake record restore.

create or replace function public.admin_get_platform_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := false;
begin
  select coalesce(p.is_admin, false) into v_is_admin
  from public.profiles p
  where p.id = auth.uid();

  if not v_is_admin then
    raise exception 'Admin only';
  end if;

  return jsonb_build_object(
    'generated_at', now(),
    'dau_today', (
      select count(distinct user_id)
      from public.product_events
      where created_at >= (timezone('utc', now()))::date
    ),
    'dau_7d', (
      select count(distinct user_id)
      from public.product_events
      where created_at > now() - interval '7 days'
    ),
    'active_games', (
      select count(*)
      from public.activities
      where status = 'active' and match_status <> 'cancelled'
    ),
    'games_created_7d', (
      select count(*)
      from public.activities
      where created_at > now() - interval '7 days'
    ),
    'joins_approved_7d', (
      select count(*)
      from public.join_requests
      where status = 'approved'
        and requested_at > now() - interval '7 days'
    ),
    'messages_sent_7d', (
      select coalesce(sum(count), 0)::bigint
      from public.user_daily_usage
      where metric = 'chat_message_sent'
        and usage_date >= (timezone('utc', now()))::date - 7
    ),
    'chat_active_users_7d', (
      select count(distinct user_id)
      from public.user_daily_usage
      where metric = 'chat_message_sent'
        and usage_date >= (timezone('utc', now()))::date - 7
    ),
    'conversations_opened_7d', (
      select count(*)
      from public.product_events
      where event_name = 'conversation_opened'
        and created_at > now() - interval '7 days'
    ),
    'pending_reports', (
      select count(*) from public.user_reports where status = 'pending'
    ),
    'feedback_7d', (
      select count(*) from public.product_feedback
      where created_at > now() - interval '7 days'
    ),
    'rallies_total', (
      select count(*) from public.regular_groups where status = 'active'
    ),
    'users_suspended', (
      select count(*) from public.profiles where coalesce(is_suspended, false)
    )
  );
end;
$$;

revoke all on function public.admin_get_platform_metrics() from public;
grant execute on function public.admin_get_platform_metrics() to authenticated;

create or replace function public.leave_game(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_join record;
  v_was_approved boolean := false;
  v_hours_before numeric;
  v_deleted int;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id for update;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id = v_user then
    raise exception 'Host cannot leave — cancel the game instead';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Cannot leave after the game is finalized';
  end if;

  select * into v_join
  from public.join_requests
  where activity_id = p_activity_id
    and user_id = v_user
    and status = 'approved';

  if found then
    v_was_approved := true;
    v_hours_before := extract(epoch from (v_activity.start_time - now())) / 3600.0;
    insert into public.activity_game_flakes (
      activity_id,
      user_id,
      was_ready,
      hours_before_start
    )
    values (
      p_activity_id,
      v_user,
      v_join.ready_at is not null,
      v_hours_before
    )
    on conflict (activity_id, user_id) do nothing;
  end if;

  delete from public.join_requests
  where activity_id = p_activity_id
    and user_id = v_user
    and status in ('pending', 'approved', 'waitlisted');

  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    raise exception 'You are not on this game';
  end if;

  if v_was_approved then
    update public.activities
    set
      player_count = greatest(1, coalesce(player_count, 1) - 1),
      missing_players = coalesce(missing_players, 0) + 1,
      updated_at = now()
    where id = p_activity_id;
  end if;

  perform public.ensure_activity_group_conversation(p_activity_id);
end;
$$;
