-- Phase 1.2: Availability polls in Rally (crew) chat.

insert into public.app_feature_flags (key, enabled, config)
values ('poll_v1', true, '{"description":"Availability poll in crew chat"}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled;

create table if not exists public.availability_polls (
  id uuid primary key default gen_random_uuid(),
  regular_group_id uuid not null references public.regular_groups(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'When can we play?',
  status text not null default 'open' check (status in ('open', 'closed')),
  closes_at timestamptz,
  winning_option_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_availability_polls_conversation
  on public.availability_polls(conversation_id, created_at desc);

create index if not exists idx_availability_polls_group
  on public.availability_polls(regular_group_id, created_at desc);

create table if not exists public.availability_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.availability_polls(id) on delete cascade,
  label text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  sort_order int not null default 0
);

create index if not exists idx_availability_poll_options_poll
  on public.availability_poll_options(poll_id, sort_order);

alter table public.availability_polls
  add constraint availability_polls_winning_option_fkey
  foreign key (winning_option_id) references public.availability_poll_options(id) on delete set null;

create table if not exists public.availability_poll_votes (
  poll_id uuid not null references public.availability_polls(id) on delete cascade,
  option_id uuid not null references public.availability_poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create index if not exists idx_availability_poll_votes_option
  on public.availability_poll_votes(option_id);

alter table public.availability_polls enable row level security;
alter table public.availability_poll_options enable row level security;
alter table public.availability_poll_votes enable row level security;

drop policy if exists "Crew members view polls" on public.availability_polls;
create policy "Crew members view polls"
  on public.availability_polls for select
  using (public.is_regular_group_member(regular_group_id, auth.uid()));

drop policy if exists "Crew members view poll options" on public.availability_poll_options;
create policy "Crew members view poll options"
  on public.availability_poll_options for select
  using (
    exists (
      select 1 from public.availability_polls p
      where p.id = poll_id
        and public.is_regular_group_member(p.regular_group_id, auth.uid())
    )
  );

drop policy if exists "Crew members view poll votes" on public.availability_poll_votes;
create policy "Crew members view poll votes"
  on public.availability_poll_votes for select
  using (
    exists (
      select 1 from public.availability_polls p
      where p.id = poll_id
        and public.is_regular_group_member(p.regular_group_id, auth.uid())
    )
  );

create or replace function public.create_availability_poll(
  p_group_id uuid,
  p_conversation_id uuid,
  p_title text,
  p_options jsonb,
  p_closes_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_poll_id uuid;
  v_opt jsonb;
  v_sort int := 0;
  v_label text;
  v_starts timestamptz;
  v_ends timestamptz;
  v_option_count int;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.app_feature_flags where key = 'poll_v1' and enabled = true
  ) then
    raise exception 'Polls are not enabled';
  end if;

  if not public.is_regular_group_member(p_group_id, v_user) then
    raise exception 'Not a member of this crew';
  end if;

  if not exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id
      and c.conversation_type = 'crew_group'
      and c.regular_group_id = p_group_id
  ) then
    raise exception 'Invalid crew conversation';
  end if;

  v_option_count := coalesce(jsonb_array_length(p_options), 0);
  if v_option_count < 2 or v_option_count > 6 then
    raise exception 'Poll must have 2 to 6 time options';
  end if;

  insert into public.availability_polls (
    regular_group_id,
    conversation_id,
    created_by,
    title,
    closes_at
  )
  values (
    p_group_id,
    p_conversation_id,
    v_user,
    coalesce(nullif(trim(p_title), ''), 'When can we play?'),
    p_closes_at
  )
  returning id into v_poll_id;

  for v_opt in select * from jsonb_array_elements(p_options)
  loop
    v_sort := v_sort + 1;
    v_label := coalesce(nullif(trim(v_opt->>'label'), ''), 'Option ' || v_sort::text);
    v_starts := (v_opt->>'starts_at')::timestamptz;
    if v_starts is null then
      raise exception 'Each option needs starts_at';
    end if;
    v_ends := nullif(v_opt->>'ends_at', '')::timestamptz;

    insert into public.availability_poll_options (poll_id, label, starts_at, ends_at, sort_order)
    values (v_poll_id, v_label, v_starts, v_ends, v_sort);
  end loop;

  insert into public.messages (conversation_id, sender_id, message_type, content)
  values (
    p_conversation_id,
    v_user,
    'system',
    'Started a poll: ' || coalesce(nullif(trim(p_title), ''), 'When can we play?')
  );

  return v_poll_id;
end;
$$;

create or replace function public.vote_availability_poll(
  p_poll_id uuid,
  p_option_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_poll record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_poll from public.availability_polls where id = p_poll_id;
  if not found then
    raise exception 'Poll not found';
  end if;

  if v_poll.status <> 'open' then
    raise exception 'Poll is closed';
  end if;

  if v_poll.closes_at is not null and v_poll.closes_at < now() then
    raise exception 'Poll has closed';
  end if;

  if not public.is_regular_group_member(v_poll.regular_group_id, v_user) then
    raise exception 'Not a member of this crew';
  end if;

  if not exists (
    select 1 from public.availability_poll_options o
    where o.id = p_option_id and o.poll_id = p_poll_id
  ) then
    raise exception 'Invalid poll option';
  end if;

  insert into public.availability_poll_votes (poll_id, option_id, user_id)
  values (p_poll_id, p_option_id, v_user)
  on conflict (poll_id, user_id)
  do update set option_id = excluded.option_id, created_at = now();
end;
$$;

create or replace function public.close_availability_poll(
  p_poll_id uuid,
  p_winning_option_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_poll record;
  v_group record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_poll from public.availability_polls where id = p_poll_id;
  if not found then
    raise exception 'Poll not found';
  end if;

  select * into v_group from public.regular_groups where id = v_poll.regular_group_id;

  if v_poll.created_by <> v_user and v_group.host_id <> v_user then
    raise exception 'Only the poll creator or crew host can close this poll';
  end if;

  if p_winning_option_id is not null and not exists (
    select 1 from public.availability_poll_options o
    where o.id = p_winning_option_id and o.poll_id = p_poll_id
  ) then
    raise exception 'Invalid winning option';
  end if;

  update public.availability_polls
  set status = 'closed',
      winning_option_id = coalesce(p_winning_option_id, winning_option_id)
  where id = p_poll_id;
end;
$$;

create or replace function public.get_conversation_polls(p_conversation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_group_id uuid;
  v_result jsonb := '[]'::jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select c.regular_group_id into v_group_id
  from public.conversations c
  where c.id = p_conversation_id and c.conversation_type = 'crew_group';

  if v_group_id is null then
    raise exception 'Not a crew conversation';
  end if;

  if not public.is_regular_group_member(v_group_id, v_user) then
    raise exception 'Not a member of this crew';
  end if;

  select coalesce(jsonb_agg(poll_row order by poll_row->>'created_at' desc), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'status', p.status,
      'closes_at', p.closes_at,
      'created_at', p.created_at,
      'created_by', p.created_by,
      'winning_option_id', p.winning_option_id,
      'my_vote_option_id', (
        select v.option_id
        from public.availability_poll_votes v
        where v.poll_id = p.id and v.user_id = v_user
        limit 1
      ),
      'options', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', o.id,
            'label', o.label,
            'starts_at', o.starts_at,
            'ends_at', o.ends_at,
            'sort_order', o.sort_order,
            'vote_count', (
              select count(*)::int
              from public.availability_poll_votes vv
              where vv.option_id = o.id
            )
          ) order by o.sort_order
        ), '[]'::jsonb)
        from public.availability_poll_options o
        where o.poll_id = p.id
      )
    ) as poll_row
    from public.availability_polls p
    where p.conversation_id = p_conversation_id
      and (p.status = 'open' or p.created_at > now() - interval '14 days')
  ) sub;

  return v_result;
end;
$$;

revoke all on function public.create_availability_poll(uuid, uuid, text, jsonb, timestamptz) from public;
grant execute on function public.create_availability_poll(uuid, uuid, text, jsonb, timestamptz) to authenticated;

revoke all on function public.vote_availability_poll(uuid, uuid) from public;
grant execute on function public.vote_availability_poll(uuid, uuid) to authenticated;

revoke all on function public.close_availability_poll(uuid, uuid) from public;
grant execute on function public.close_availability_poll(uuid, uuid) to authenticated;

revoke all on function public.get_conversation_polls(uuid) from public;
grant execute on function public.get_conversation_polls(uuid) to authenticated;
