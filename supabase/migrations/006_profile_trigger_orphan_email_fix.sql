-- Fix signup failure when profiles contains orphan rows (email exists but auth user was deleted).
-- Without this, auth signup can fail with:
-- duplicate key value violates unique constraint "profiles_email_key".

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

  -- Clean orphan profile rows for same email (rows not tied to any auth.users id).
  -- This prevents unique(email) conflicts during signup after admin user deletion.
  if new.email is not null then
    delete from public.profiles p
    where p.email = new.email
      and p.id <> new.id
      and not exists (
        select 1
        from auth.users u
        where u.id = p.id
      );
  end if;

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
