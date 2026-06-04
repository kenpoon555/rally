-- Fix infinite recursion: conversation_members SELECT policy must not query itself under RLS.

create or replace function public.is_active_conversation_member(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = auth.uid()
      and cm.is_active = true
  );
$$;

revoke all on function public.is_active_conversation_member(uuid) from public;
grant execute on function public.is_active_conversation_member(uuid) to authenticated;

drop policy if exists "Members can view membership of their conversations" on public.conversation_members;
create policy "Members can view membership of their conversations"
  on public.conversation_members
  for select
  using (public.is_active_conversation_member(conversation_id));

drop policy if exists "Members can view conversations" on public.conversations;
create policy "Members can view conversations"
  on public.conversations
  for select
  using (public.is_active_conversation_member(id));

drop policy if exists "Members can read messages" on public.messages;
create policy "Members can read messages"
  on public.messages
  for select
  using (public.is_active_conversation_member(conversation_id));

drop policy if exists "Members can send messages as themselves" on public.messages;
create policy "Members can send messages as themselves"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and public.is_active_conversation_member(conversation_id)
  );
