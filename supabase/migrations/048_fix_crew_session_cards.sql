-- Fix list_crew_session_cards: subquery only selected id but jsonb_agg ordered by a.start_time.

create or replace function public.list_crew_session_cards(
  p_regular_group_id uuid,
  p_limit int default 12
)
returns jsonb
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

  if not public.is_regular_group_member(p_regular_group_id, v_user) then
    raise exception 'Not a Rally member';
  end if;

  return coalesce((
    select jsonb_agg(
      public._build_session_card_payload(sub.id, v_user)
      order by sub.start_time desc
    )
    from (
      select id, start_time
      from public.activities
      where regular_group_id = p_regular_group_id
      order by start_time desc
      limit greatest(1, least(p_limit, 30))
    ) sub
  ), '[]'::jsonb);
end;
$$;

-- Rally-aligned error copy (was "Crew not found" / "crew members").
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

grant execute on function public.list_crew_session_cards(uuid, int) to authenticated;
grant execute on function public.ensure_crew_conversation(uuid) to authenticated;
