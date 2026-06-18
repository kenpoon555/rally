-- In-app account deletion (App Store Guideline 5.1.1(v)).
-- Authenticated user deletes their own auth record; profile row cascades via FKs.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Remove profile first (cascades to user-owned rows).
  delete from public.profiles where id = uid;

  -- Remove auth identity so the user cannot sign in again.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

comment on function public.delete_own_account() is
  'Self-service account deletion for App Store compliance. Caller must be authenticated.';
