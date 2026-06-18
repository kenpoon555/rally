-- Client enrollment via security definer RPC (avoids RLS recursion on insert).

create or replace function public.enroll_student_in_class(
  p_student_profile_id uuid,
  p_coach_user_id uuid,
  p_class_id text,
  p_class_title text,
  p_sport_type text
)
returns public.student_enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.student_enrollments;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.parent_is_adult_18_plus(auth.uid()) then
    raise exception 'Only adults 18+ can enroll students';
  end if;

  if not exists (
    select 1
    from public.student_profiles sp
    where sp.id = p_student_profile_id
      and sp.parent_user_id = auth.uid()
      and sp.status = 'active'
  ) then
    raise exception 'Student profile not found';
  end if;

  select *
  into v_row
  from public.student_enrollments e
  where e.student_profile_id = p_student_profile_id
    and e.coach_user_id = p_coach_user_id
    and e.class_id = p_class_id
    and e.status = 'active'
  limit 1;

  if found then
    return v_row;
  end if;

  insert into public.student_enrollments (
    student_profile_id,
    coach_user_id,
    class_id,
    class_title,
    sport_type,
    status,
    response_status
  )
  values (
    p_student_profile_id,
    p_coach_user_id,
    p_class_id,
    p_class_title,
    p_sport_type,
    'active',
    'confirmed'
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.enroll_student_in_class(uuid, uuid, text, text, text) to authenticated;
