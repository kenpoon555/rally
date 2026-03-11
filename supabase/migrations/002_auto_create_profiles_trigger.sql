-- Auto-create profile rows for new auth users.
-- This prevents "authenticated user with missing profile" states.

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_username text;
begin
  derived_username := left(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'user_' || replace(new.id::text, '-', '')
    ),
    30
  );

  insert into public.profiles (id, username, email, phone, preferred_sports)
  values (
    new.id,
    derived_username,
    new.email,
    nullif(new.phone, ''),
    '{}'::text[]
  )
  on conflict (id) do update
    set email = excluded.email,
        phone = excluded.phone;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute procedure public.handle_new_auth_user_profile();

-- Backfill safety: create any missing profiles for already-existing auth users.
insert into public.profiles (id, username, email, phone, preferred_sports)
select
  u.id,
  left(
    coalesce(
      nullif(u.raw_user_meta_data ->> 'username', ''),
      nullif(split_part(u.email, '@', 1), ''),
      'user_' || replace(u.id::text, '-', '')
    ),
    30
  ) as username,
  u.email,
  nullif(u.phone, ''),
  '{}'::text[]
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
