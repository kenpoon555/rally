-- Ensure crew chat column exists (some environments missed migration 030).

alter table public.conversations
  drop constraint if exists conversations_conversation_type_check;

alter table public.conversations
  add constraint conversations_conversation_type_check
  check (conversation_type in ('activity_group', 'friend_direct', 'crew_group'));

alter table public.conversations
  add column if not exists regular_group_id uuid references public.regular_groups(id) on delete cascade;

create unique index if not exists idx_conversations_crew_group_unique
  on public.conversations(regular_group_id)
  where conversation_type = 'crew_group' and regular_group_id is not null;

create or replace function public.ensure_crew_conversation(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_group record;
  v_conversation_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_group from public.regular_groups where id = p_group_id;
  if not found then
    raise exception 'Rally not found';
  end if;

  if not public.is_regular_group_member(p_group_id, v_user) and v_group.host_id <> v_user then
    raise exception 'Only Rally members can open this chat';
  end if;

  select c.id into v_conversation_id
  from public.conversations c
  where c.conversation_type = 'crew_group'
    and c.regular_group_id = p_group_id
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations (
      conversation_type,
      regular_group_id,
      created_by,
      title
    )
    values ('crew_group', p_group_id, v_group.host_id, v_group.name)
    returning id into v_conversation_id;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  values (v_conversation_id, v_group.host_id, 'host', true)
  on conflict (conversation_id, user_id)
  do update set is_active = true, role = 'host';

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  select v_conversation_id, rgm.user_id, rgm.role, true
  from public.regular_group_members rgm
  where rgm.group_id = p_group_id
    and rgm.user_id <> v_group.host_id
  on conflict (conversation_id, user_id)
  do update set is_active = true, role = excluded.role;

  return v_conversation_id;
end;
$$;

grant execute on function public.ensure_crew_conversation(uuid) to authenticated;
