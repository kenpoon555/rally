-- Stage 2: Cost control + liquidity instrumentation (rate limits, feature flags, funnel events).

create table if not exists public.app_feature_flags (
  key text primary key,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_feature_flags (key, enabled, config)
values
  ('rate_limit_discovery', true, '{"daily_limit": 300}'::jsonb),
  ('rate_limit_chat_message', true, '{"daily_limit": 500}'::jsonb),
  ('rate_limit_push_send', true, '{"daily_limit": 40}'::jsonb),
  ('analytics_enabled', true, '{}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.user_daily_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null default (timezone('utc', now()))::date,
  metric text not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, usage_date, metric)
);

create index if not exists idx_user_daily_usage_metric_date
  on public.user_daily_usage(metric, usage_date);

create table if not exists public.product_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_events_user_created
  on public.product_events(user_id, created_at desc);

create index if not exists idx_product_events_name_created
  on public.product_events(event_name, created_at desc);

-- Maps usage metric -> feature flag key holding daily_limit.
create or replace function public.rate_limit_flag_key(p_metric text)
returns text
language sql
immutable
as $$
  select case p_metric
    when 'discovery_search' then 'rate_limit_discovery'
    when 'chat_message' then 'rate_limit_chat_message'
    when 'push_send' then 'rate_limit_push_send'
    else null
  end;
$$;

-- Increment daily counter and return whether the action is allowed.
create or replace function public.consume_rate_limit(p_metric text, p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flag_key text;
  v_flag record;
  v_limit int;
  v_count int;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_flag_key := public.rate_limit_flag_key(p_metric);
  if v_flag_key is null then
    return jsonb_build_object('allowed', true, 'count', 0, 'limit', null, 'skipped', true);
  end if;

  select * into v_flag from public.app_feature_flags where key = v_flag_key;
  if not found or v_flag.enabled is not true then
    return jsonb_build_object('allowed', true, 'count', 0, 'limit', null, 'skipped', true);
  end if;

  v_limit := coalesce((v_flag.config->>'daily_limit')::int, 999999);

  insert into public.user_daily_usage (user_id, usage_date, metric, count)
  values (p_user_id, (timezone('utc', now()))::date, p_metric, 1)
  on conflict (user_id, usage_date, metric)
  do update set count = public.user_daily_usage.count + 1
  returning count into v_count;

  return jsonb_build_object(
    'allowed', v_count <= v_limit,
    'count', v_count,
    'limit', v_limit,
    'metric', p_metric
  );
end;
$$;

create or replace function public.track_product_event(
  p_event_name text,
  p_properties jsonb default '{}'::jsonb,
  p_user_id uuid default auth.uid()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
  v_event_id uuid;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select enabled into v_enabled
  from public.app_feature_flags
  where key = 'analytics_enabled';

  if coalesce(v_enabled, true) is not true then
    return null;
  end if;

  insert into public.product_events (user_id, event_name, properties)
  values (p_user_id, p_event_name, coalesce(p_properties, '{}'::jsonb))
  returning id into v_event_id;

  return v_event_id;
end;
$$;

alter table public.app_feature_flags enable row level security;
alter table public.user_daily_usage enable row level security;
alter table public.product_events enable row level security;

drop policy if exists "Authenticated users can read feature flags" on public.app_feature_flags;
create policy "Authenticated users can read feature flags"
  on public.app_feature_flags
  for select
  to authenticated
  using (true);

drop policy if exists "Users read own daily usage" on public.user_daily_usage;
create policy "Users read own daily usage"
  on public.user_daily_usage
  for select
  using (user_id = auth.uid());

drop policy if exists "Users insert own product events" on public.product_events;
create policy "Users insert own product events"
  on public.product_events
  for insert
  with check (user_id = auth.uid());

grant execute on function public.consume_rate_limit(text, uuid) to authenticated;
grant execute on function public.track_product_event(text, jsonb, uuid) to authenticated;
grant execute on function public.rate_limit_flag_key(text) to authenticated;
