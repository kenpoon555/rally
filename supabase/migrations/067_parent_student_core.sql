-- Parent/student core (v1.2): age category, student profiles, guardian consent, enrollments + RLS.

do $$ begin
  create type public.age_category as enum ('under_13', 'teen_13_17', 'adult_18_plus');
exception
  when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists age_category public.age_category;

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_student_profiles_parent
  on public.student_profiles(parent_user_id)
  where status = 'active';

create table if not exists public.guardian_consents (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.profiles(id) on delete cascade,
  student_profile_id uuid references public.student_profiles(id) on delete set null,
  policy_version text not null,
  attested_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_guardian_consents_parent
  on public.guardian_consents(parent_user_id, attested_at desc);

create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  coach_user_id uuid not null references public.profiles(id) on delete cascade,
  class_title text not null,
  sport_type text,
  status text not null default 'active' check (status in ('active', 'ended')),
  enrolled_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists idx_student_enrollments_coach
  on public.student_enrollments(coach_user_id, status)
  where status = 'active';

create index if not exists idx_student_enrollments_student
  on public.student_enrollments(student_profile_id, status)
  where status = 'active';

-- Parent is adult (18+)
create or replace function public.parent_is_adult_18_plus(p_parent_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_parent_id
      and p.age_category = 'adult_18_plus'
  );
$$;

create or replace function public.active_student_profile_count(p_parent_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.student_profiles sp
  where sp.parent_user_id = p_parent_id
    and sp.status = 'active';
$$;

alter table public.student_profiles enable row level security;
alter table public.guardian_consents enable row level security;
alter table public.student_enrollments enable row level security;

drop policy if exists "Parents manage own student profiles" on public.student_profiles;
create policy "Parents manage own student profiles"
  on public.student_profiles
  for all
  using (parent_user_id = auth.uid())
  with check (
    parent_user_id = auth.uid()
    and public.parent_is_adult_18_plus(auth.uid())
  );

drop policy if exists "Coaches view enrolled students" on public.student_profiles;
create policy "Coaches view enrolled students"
  on public.student_profiles
  for select
  using (
    exists (
      select 1
      from public.student_enrollments e
      where e.student_profile_id = student_profiles.id
        and e.coach_user_id = auth.uid()
        and e.status = 'active'
    )
  );

drop policy if exists "Parents manage guardian consents" on public.guardian_consents;
create policy "Parents manage guardian consents"
  on public.guardian_consents
  for all
  using (parent_user_id = auth.uid())
  with check (parent_user_id = auth.uid());

drop policy if exists "Parents view own enrollments" on public.student_enrollments;
create policy "Parents view own enrollments"
  on public.student_enrollments
  for select
  using (
    exists (
      select 1
      from public.student_profiles sp
      where sp.id = student_enrollments.student_profile_id
        and sp.parent_user_id = auth.uid()
    )
  );

drop policy if exists "Coaches view their enrollments" on public.student_enrollments;
create policy "Coaches view their enrollments"
  on public.student_enrollments
  for select
  using (coach_user_id = auth.uid());

drop policy if exists "Parents insert enrollments for own students" on public.student_enrollments;
create policy "Parents insert enrollments for own students"
  on public.student_enrollments
  for insert
  with check (
    exists (
      select 1
      from public.student_profiles sp
      where sp.id = student_enrollments.student_profile_id
        and sp.parent_user_id = auth.uid()
    )
  );

insert into public.app_feature_flags (key, enabled, config)
values
  ('age_gate_onboarding_v1', false, '{"description":"Age category at signup"}'::jsonb),
  ('student_profiles_v1', false, '{"description":"Parent-owned student profiles"}'::jsonb),
  ('guardian_consent_v1', false, '{"description":"Guardian attestation before student profile"}'::jsonb)
on conflict (key) do nothing;
