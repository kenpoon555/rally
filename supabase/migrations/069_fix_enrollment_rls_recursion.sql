-- Fix infinite recursion between student_profiles and student_enrollments RLS.

create or replace function public.parent_owns_active_student(
  p_student_id uuid,
  p_parent_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_profiles sp
    where sp.id = p_student_id
      and sp.parent_user_id = p_parent_id
      and sp.status = 'active'
  );
$$;

create or replace function public.coach_has_active_enrollment(
  p_student_id uuid,
  p_coach_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_enrollments e
    where e.student_profile_id = p_student_id
      and e.coach_user_id = p_coach_id
      and e.status = 'active'
  );
$$;

drop policy if exists "Parents view own enrollments" on public.student_enrollments;
create policy "Parents view own enrollments"
  on public.student_enrollments
  for select
  using (public.parent_owns_active_student(student_profile_id));

drop policy if exists "Parents insert enrollments for own students" on public.student_enrollments;
create policy "Parents insert enrollments for own students"
  on public.student_enrollments
  for insert
  with check (
    public.parent_owns_active_student(student_profile_id)
    and public.parent_is_adult_18_plus(auth.uid())
  );

drop policy if exists "Parents update own enrollments" on public.student_enrollments;
create policy "Parents update own enrollments"
  on public.student_enrollments
  for update
  using (public.parent_owns_active_student(student_profile_id))
  with check (public.parent_owns_active_student(student_profile_id));

drop policy if exists "Coaches view enrolled students" on public.student_profiles;
create policy "Coaches view enrolled students"
  on public.student_profiles
  for select
  using (public.coach_has_active_enrollment(id));
