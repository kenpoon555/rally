-- Parent pilot (v1.3): class enrollment invites, roster fields, attendance.

alter table public.student_enrollments
  add column if not exists class_id text,
  add column if not exists response_status text not null default 'not_responded'
    check (response_status in ('confirmed', 'not_responded', 'cant_make_it')),
  add column if not exists attendance_status text
    check (attendance_status is null or attendance_status in ('present', 'absent'));

create unique index if not exists idx_student_enrollments_active_class
  on public.student_enrollments(student_profile_id, coach_user_id, class_id)
  where status = 'active' and class_id is not null;

create table if not exists public.class_enrollment_invites (
  id uuid primary key default gen_random_uuid(),
  invite_token uuid not null default gen_random_uuid(),
  coach_user_id uuid not null references public.profiles(id) on delete cascade,
  class_id text not null,
  class_title text not null,
  sport_type text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (invite_token)
);

create index if not exists idx_class_enrollment_invites_coach
  on public.class_enrollment_invites(coach_user_id, class_id);

alter table public.class_enrollment_invites enable row level security;

drop policy if exists "Coaches manage class enrollment invites" on public.class_enrollment_invites;
create policy "Coaches manage class enrollment invites"
  on public.class_enrollment_invites
  for all
  using (coach_user_id = auth.uid())
  with check (coach_user_id = auth.uid());

drop policy if exists "Authenticated read class enrollment invites" on public.class_enrollment_invites;
create policy "Authenticated read class enrollment invites"
  on public.class_enrollment_invites
  for select
  using (auth.uid() is not null);

drop policy if exists "Parents update own enrollments" on public.student_enrollments;
create policy "Parents update own enrollments"
  on public.student_enrollments
  for update
  using (
    exists (
      select 1
      from public.student_profiles sp
      where sp.id = student_enrollments.student_profile_id
        and sp.parent_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.student_profiles sp
      where sp.id = student_enrollments.student_profile_id
        and sp.parent_user_id = auth.uid()
    )
  );

drop policy if exists "Coaches update enrollment attendance" on public.student_enrollments;
create policy "Coaches update enrollment attendance"
  on public.student_enrollments
  for update
  using (coach_user_id = auth.uid())
  with check (coach_user_id = auth.uid());

insert into public.app_feature_flags (key, enabled, config)
values
  ('parent_pilot_enrollment_v1', false, '{"description":"Parent class enrollment pilot"}'::jsonb)
on conflict (key) do nothing;
