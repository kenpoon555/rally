-- Fix admin_get_platform_metrics: regular_groups has no status column.

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
      select count(*) from public.regular_groups
    ),
    'users_suspended', (
      select count(*) from public.profiles where coalesce(is_suspended, false)
    )
  );
end;
$$;
