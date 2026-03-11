-- Phase 7 + Phase 9 / V2.1 foundation:
-- Review system, aggregate score strategy, identity visibility helper, and chat schema.

-- 1) Player reviews.
create table if not exists public.player_reviews (
  id uuid primary key default uuid_generate_v4(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_id uuid not null references public.profiles(id) on delete cascade,
  friendliness_rating smallint not null check (friendliness_rating between 1 and 5),
  physicality_rating smallint not null check (physicality_rating between 1 and 5),
  overall_vibe_rating smallint not null check (overall_vibe_rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, reviewer_id, reviewed_id),
  check (reviewer_id <> reviewed_id)
);

create index if not exists idx_player_reviews_activity_id
  on public.player_reviews(activity_id);

create index if not exists idx_player_reviews_reviewed_id
  on public.player_reviews(reviewed_id);

create index if not exists idx_player_reviews_reviewer_id
  on public.player_reviews(reviewer_id);

create or replace function public.touch_player_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_player_reviews_updated_at on public.player_reviews;
create trigger trg_touch_player_reviews_updated_at
before update on public.player_reviews
for each row execute procedure public.touch_player_reviews_updated_at();

-- Aggregate score strategy:
-- visible_score only appears once review_count >= 5.
create or replace view public.profile_review_stats as
select
  pr.reviewed_id as user_id,
  count(*)::integer as review_count,
  round(avg(pr.friendliness_rating)::numeric, 2) as avg_friendliness,
  round(avg(pr.physicality_rating)::numeric, 2) as avg_physicality,
  round(avg(pr.overall_vibe_rating)::numeric, 2) as avg_vibe,
  round(avg((pr.friendliness_rating + pr.physicality_rating + pr.overall_vibe_rating) / 3.0)::numeric, 2) as raw_score,
  case
    when count(*) >= 5
      then round(avg((pr.friendliness_rating + pr.physicality_rating + pr.overall_vibe_rating) / 3.0)::numeric, 2)
    else null
  end as visible_score
from public.player_reviews pr
group by pr.reviewed_id;

-- 2) Identity visibility helper (anonymous-until-confirmed).
create or replace function public.can_view_profile_identity(
  target_user_id uuid,
  context_activity_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid;
  is_friend boolean;
  same_confirmed_activity boolean;
begin
  viewer := auth.uid();

  if viewer is null then
    return false;
  end if;

  if viewer = target_user_id then
    return true;
  end if;

  -- Friends can always see each other.
  select exists (
    select 1
    from public.friends f
    where (
      (f.user_id = viewer and f.friend_id = target_user_id)
      or
      (f.user_id = target_user_id and f.friend_id = viewer)
    )
    and f.status = 'accepted'
  )
  into is_friend;

  if is_friend then
    return true;
  end if;

  -- Anonymous-until-confirmed identity unlock:
  -- only confirmed participants in the same finalized activity can see each other.
  if context_activity_id is null then
    return false;
  end if;

  select exists (
    select 1
    from public.activities a
    where a.id = context_activity_id
      and a.match_status = 'finalized'
      and (
        a.user_id = viewer
        or exists (
          select 1
          from public.join_requests jr_viewer
          where jr_viewer.activity_id = a.id
            and jr_viewer.user_id = viewer
            and jr_viewer.status = 'approved'
        )
      )
      and (
        a.user_id = target_user_id
        or exists (
          select 1
          from public.join_requests jr_target
          where jr_target.activity_id = a.id
            and jr_target.user_id = target_user_id
            and jr_target.status = 'approved'
        )
      )
  )
  into same_confirmed_activity;

  return coalesce(same_confirmed_activity, false);
end;
$$;

-- 3) Chat schema.
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  conversation_type text not null check (conversation_type in ('activity_group', 'friend_direct')),
  activity_id uuid references public.activities(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_conversations_activity_group_unique
  on public.conversations(activity_id)
  where conversation_type = 'activity_group' and activity_id is not null;

create index if not exists idx_conversations_created_by
  on public.conversations(created_by);

create table if not exists public.conversation_members (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('host', 'member')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  is_active boolean not null default true,
  unique (conversation_id, user_id)
);

create index if not exists idx_conversation_members_conversation_id
  on public.conversation_members(conversation_id);

create index if not exists idx_conversation_members_user_id
  on public.conversation_members(user_id);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index if not exists idx_messages_conversation_id_created_at
  on public.messages(conversation_id, created_at desc);

create index if not exists idx_messages_sender_id
  on public.messages(sender_id);

create or replace function public.touch_conversations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_conversations_updated_at on public.conversations;
create trigger trg_touch_conversations_updated_at
before update on public.conversations
for each row execute procedure public.touch_conversations_updated_at();

create or replace function public.touch_messages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_messages_updated_at on public.messages;
create trigger trg_touch_messages_updated_at
before update on public.messages
for each row execute procedure public.touch_messages_updated_at();

-- 4) Enable RLS.
alter table public.player_reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Player review RLS.
drop policy if exists "Users can view reviews they gave or received" on public.player_reviews;
create policy "Users can view reviews they gave or received"
  on public.player_reviews
  for select
  using (
    reviewer_id = auth.uid()
    or reviewed_id = auth.uid()
  );

drop policy if exists "Users can create valid post-match reviews" on public.player_reviews;
create policy "Users can create valid post-match reviews"
  on public.player_reviews
  for insert
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1
      from public.activities a
      where a.id = player_reviews.activity_id
        and a.status = 'completed'
        and (
          a.user_id = reviewer_id
          or exists (
            select 1
            from public.join_requests jr1
            where jr1.activity_id = a.id
              and jr1.user_id = reviewer_id
              and jr1.status = 'approved'
          )
        )
        and (
          a.user_id = reviewed_id
          or exists (
            select 1
            from public.join_requests jr2
            where jr2.activity_id = a.id
              and jr2.user_id = reviewed_id
              and jr2.status = 'approved'
          )
        )
    )
  );

drop policy if exists "Users can update own reviews" on public.player_reviews;
create policy "Users can update own reviews"
  on public.player_reviews
  for update
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists "Users can delete own reviews" on public.player_reviews;
create policy "Users can delete own reviews"
  on public.player_reviews
  for delete
  using (reviewer_id = auth.uid());

-- Conversation RLS.
drop policy if exists "Members can view conversations" on public.conversations;
create policy "Members can view conversations"
  on public.conversations
  for select
  using (
    exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = conversations.id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  );

drop policy if exists "Users can create conversations" on public.conversations;
create policy "Users can create conversations"
  on public.conversations
  for insert
  with check (created_by = auth.uid());

drop policy if exists "Conversation creator can update conversation metadata" on public.conversations;
create policy "Conversation creator can update conversation metadata"
  on public.conversations
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Conversation member RLS.
drop policy if exists "Members can view membership of their conversations" on public.conversation_members;
create policy "Members can view membership of their conversations"
  on public.conversation_members
  for select
  using (
    exists (
      select 1
      from public.conversation_members mine
      where mine.conversation_id = conversation_members.conversation_id
        and mine.user_id = auth.uid()
        and mine.is_active = true
    )
  );

drop policy if exists "Conversation creator can add members" on public.conversation_members;
create policy "Conversation creator can add members"
  on public.conversation_members
  for insert
  with check (
    exists (
      select 1
      from public.conversations c
      where c.id = conversation_members.conversation_id
        and c.created_by = auth.uid()
    )
    or user_id = auth.uid()
  );

drop policy if exists "Users can update own membership row" on public.conversation_members;
create policy "Users can update own membership row"
  on public.conversation_members
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can leave conversations themselves" on public.conversation_members;
create policy "Users can leave conversations themselves"
  on public.conversation_members
  for delete
  using (user_id = auth.uid());

-- Message RLS.
drop policy if exists "Members can read messages" on public.messages;
create policy "Members can read messages"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  );

drop policy if exists "Members can send messages as themselves" on public.messages;
create policy "Members can send messages as themselves"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  );

drop policy if exists "Users can edit own messages" on public.messages;
create policy "Users can edit own messages"
  on public.messages
  for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists "Users can delete own messages" on public.messages;
create policy "Users can delete own messages"
  on public.messages
  for delete
  using (sender_id = auth.uid());

-- 5) Helper RPC: create/get direct chat for accepted friends.
create or replace function public.get_or_create_direct_conversation(
  target_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid;
  existing_conversation_id uuid;
begin
  viewer_id := auth.uid();
  if viewer_id is null then
    raise exception 'Authentication required';
  end if;

  if viewer_id = target_user_id then
    raise exception 'Cannot create direct conversation with self';
  end if;

  if not exists (
    select 1
    from public.friends f
    where (
      (f.user_id = viewer_id and f.friend_id = target_user_id)
      or
      (f.user_id = target_user_id and f.friend_id = viewer_id)
    )
    and f.status = 'accepted'
  ) then
    raise exception 'Direct conversation requires accepted friendship';
  end if;

  select c.id
  into existing_conversation_id
  from public.conversations c
  join public.conversation_members cm1 on cm1.conversation_id = c.id and cm1.user_id = viewer_id
  join public.conversation_members cm2 on cm2.conversation_id = c.id and cm2.user_id = target_user_id
  where c.conversation_type = 'friend_direct'
  limit 1;

  if existing_conversation_id is not null then
    return existing_conversation_id;
  end if;

  insert into public.conversations (conversation_type, created_by, title)
  values ('friend_direct', viewer_id, null)
  returning id into existing_conversation_id;

  insert into public.conversation_members (conversation_id, user_id, role)
  values
    (existing_conversation_id, viewer_id, 'member'),
    (existing_conversation_id, target_user_id, 'member')
  on conflict (conversation_id, user_id) do nothing;

  return existing_conversation_id;
end;
$$;

-- 6) Helper RPC: create activity group chat after finalization.
create or replace function public.create_activity_group_conversation(
  target_activity_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid;
  conversation_id uuid;
begin
  viewer_id := auth.uid();
  if viewer_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.activities a
    where a.id = target_activity_id
      and a.user_id = viewer_id
      and a.match_status = 'finalized'
  ) then
    raise exception 'Only finalized activity host can create group conversation';
  end if;

  select c.id
  into conversation_id
  from public.conversations c
  where c.activity_id = target_activity_id
    and c.conversation_type = 'activity_group'
  limit 1;

  if conversation_id is null then
    insert into public.conversations (conversation_type, activity_id, created_by, title)
    values ('activity_group', target_activity_id, viewer_id, 'Activity Chat')
    returning id into conversation_id;
  end if;

  -- Host
  insert into public.conversation_members (conversation_id, user_id, role)
  values (conversation_id, viewer_id, 'host')
  on conflict (conversation_id, user_id) do nothing;

  -- Approved participants
  insert into public.conversation_members (conversation_id, user_id, role)
  select conversation_id, jr.user_id, 'member'
  from public.join_requests jr
  where jr.activity_id = target_activity_id
    and jr.status = 'approved'
  on conflict (conversation_id, user_id) do nothing;

  return conversation_id;
end;
$$;

grant select on public.profile_review_stats to authenticated;
