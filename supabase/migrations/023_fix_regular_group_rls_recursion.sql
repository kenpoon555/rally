-- Fix infinite recursion in regular_group_members RLS (policies referenced each other).

create or replace function public.is_regular_group_member(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.regular_group_members rgm
    where rgm.group_id = p_group_id
      and rgm.user_id = p_user_id
  )
  or exists (
    select 1
    from public.regular_groups rg
    where rg.id = p_group_id
      and rg.host_id = p_user_id
  );
$$;

revoke all on function public.is_regular_group_member(uuid, uuid) from public;
grant execute on function public.is_regular_group_member(uuid, uuid) to authenticated;

drop policy if exists "Members view their regular groups" on public.regular_groups;
create policy "Members view their regular groups"
  on public.regular_groups for select
  using (
    host_id = auth.uid()
    or public.is_regular_group_member(id, auth.uid())
  );

drop policy if exists "Members view regular group roster" on public.regular_group_members;
create policy "Members view regular group roster"
  on public.regular_group_members for select
  using (
    user_id = auth.uid()
    or public.is_regular_group_member(group_id, auth.uid())
  );
