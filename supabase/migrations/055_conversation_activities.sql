-- conversation_activities was defined in 030 but missing on remote — breaks crew/Rally chat session cards.

create table if not exists public.conversation_activities (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  position integer not null default 1,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (conversation_id, activity_id)
);

create index if not exists idx_conversation_activities_conversation
  on public.conversation_activities(conversation_id, position);

create index if not exists idx_conversation_activities_activity
  on public.conversation_activities(activity_id);

alter table public.conversation_activities enable row level security;

drop policy if exists "Crew members view conversation activities" on public.conversation_activities;
create policy "Crew members view conversation activities"
  on public.conversation_activities for select
  using (
    exists (
      select 1
      from public.conversations c
      join public.regular_group_members rgm
        on rgm.group_id = c.regular_group_id
      where c.id = conversation_activities.conversation_id
        and rgm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.conversations c
      join public.regular_groups rg on rg.id = c.regular_group_id
      where c.id = conversation_activities.conversation_id
        and rg.host_id = auth.uid()
    )
    or exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = conversation_activities.conversation_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  );

-- Backfill crew games into session cards (no system-message spam).
do $$
declare
  v_row record;
  v_conversation_id uuid;
  v_position integer;
begin
  for v_row in
    select a.id as activity_id, a.regular_group_id as group_id, a.start_time
    from public.activities a
    where a.regular_group_id is not null
      and not exists (
        select 1
        from public.conversation_activities ca
        where ca.activity_id = a.id
      )
    order by a.start_time asc
  loop
    begin
      select c.id into v_conversation_id
      from public.conversations c
      where c.conversation_type = 'crew_group'
        and c.regular_group_id = v_row.group_id
      limit 1;

      if v_conversation_id is null then
        insert into public.conversations (
          conversation_type, regular_group_id, created_by, title
        )
        select 'crew_group', rg.id, rg.host_id, rg.name
        from public.regular_groups rg
        where rg.id = v_row.group_id
        returning id into v_conversation_id;
      end if;

      if v_conversation_id is null then
        continue;
      end if;

      select coalesce(max(ca.position), 0) + 1 into v_position
      from public.conversation_activities ca
      where ca.conversation_id = v_conversation_id;

      insert into public.conversation_activities (
        conversation_id, activity_id, position, is_current
      )
      values (v_conversation_id, v_row.activity_id, v_position, false)
      on conflict (conversation_id, activity_id) do nothing;
    exception when others then
      raise notice 'backfill skip activity %: %', v_row.activity_id, sqlerrm;
    end;
  end loop;

  for v_conversation_id in
    select distinct c.id
    from public.conversations c
    where c.conversation_type = 'crew_group'
  loop
    begin
      perform public.refresh_crew_conversation_current_session(v_conversation_id);
    exception when others then
      raise notice 'refresh skip conversation %: %', v_conversation_id, sqlerrm;
    end;
  end loop;
end $$;
