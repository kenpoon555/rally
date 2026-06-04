-- Finish Stage 1 (legal, admin, trust stats) + Stage 2 (chat_create limit, analytics views).

alter table public.profiles
  add column if not exists tos_accepted_at timestamptz,
  add column if not exists tos_version text,
  add column if not exists location_privacy_ack_at timestamptz,
  add column if not exists is_admin boolean not null default false;

insert into public.app_feature_flags (key, enabled, config)
values ('rate_limit_chat_create', true, '{"daily_limit": 20}'::jsonb)
on conflict (key) do nothing;

create or replace function public.rate_limit_flag_key(p_metric text)
returns text
language sql
immutable
as $$
  select case p_metric
    when 'discovery_search' then 'rate_limit_discovery'
    when 'chat_message' then 'rate_limit_chat_message'
    when 'push_send' then 'rate_limit_push_send'
    when 'chat_create' then 'rate_limit_chat_create'
    else null
  end;
$$;

create or replace function public.get_profile_trust_stats(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_no_shows int;
  v_reports int;
begin
  if p_user_id is null then
    return '{}'::jsonb;
  end if;

  select count(*)::int into v_no_shows
  from public.activity_no_shows
  where reported_user_id = p_user_id;

  select count(*)::int into v_reports
  from public.user_reports
  where reported_id = p_user_id and status = 'pending';

  return jsonb_build_object(
    'no_show_count', coalesce(v_no_shows, 0),
    'pending_reports', coalesce(v_reports, 0)
  );
end;
$$;

create or replace function public.admin_list_pending_reports(p_limit int default 50)
returns setof public.user_reports
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin is true) then
    raise exception 'Admin access required';
  end if;

  return query
  select *
  from public.user_reports
  where status = 'pending'
  order by created_at desc
  limit greatest(1, least(p_limit, 200));
end;
$$;

create or replace function public.admin_update_report_status(
  p_report_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin is true) then
    raise exception 'Admin access required';
  end if;

  if p_status not in ('pending', 'reviewed', 'dismissed') then
    raise exception 'Invalid report status';
  end if;

  update public.user_reports
  set status = p_status
  where id = p_report_id;
end;
$$;

create or replace function public.admin_set_user_suspended(
  p_user_id uuid,
  p_suspend boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin is true) then
    raise exception 'Admin access required';
  end if;

  update public.profiles
  set
    is_suspended = p_suspend,
    suspended_at = case when p_suspend then now() else null end,
    updated_at = now()
  where id = p_user_id;
end;
$$;

create or replace function public.users_played_together_before(
  p_host_id uuid,
  p_guest_id uuid,
  p_exclude_activity_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.join_requests jr
    join public.activities a on a.id = jr.activity_id
    where jr.status = 'approved'
      and jr.user_id = p_guest_id
      and a.user_id = p_host_id
      and jr.activity_id <> coalesce(p_exclude_activity_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
$$;

-- Funnel rollup (query with service role or SQL editor).
create or replace view public.analytics_funnel_7d as
select
  event_name,
  count(*) as event_count,
  count(distinct user_id) as unique_users
from public.product_events
where created_at > now() - interval '7 days'
group by event_name
order by event_count desc;

create or replace view public.analytics_usage_7d as
select
  usage_date,
  metric,
  sum(count) as total_actions,
  count(distinct user_id) as unique_users
from public.user_daily_usage
where usage_date >= (timezone('utc', now()))::date - 7
group by usage_date, metric
order by usage_date desc, metric;

grant execute on function public.get_profile_trust_stats(uuid) to authenticated;
grant execute on function public.admin_list_pending_reports(int) to authenticated;
grant execute on function public.admin_update_report_status(uuid, text) to authenticated;
grant execute on function public.admin_set_user_suspended(uuid, boolean) to authenticated;
grant execute on function public.users_played_together_before(uuid, uuid, uuid) to authenticated;
grant select on public.analytics_funnel_7d to authenticated;
grant select on public.analytics_usage_7d to authenticated;
