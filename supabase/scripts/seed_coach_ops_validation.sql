-- v1.4 coach ops validation — run after seed_parent_student_validation.sql

-- Ensure session state row exists for badminton (optional baseline)
insert into public.coach_class_session_state (
  class_id, coach_user_id, class_title, sport_type,
  scheduled_start, effective_start, duration_minutes, session_status
)
select
  'class-demo-badminton',
  'd1000001-0001-4001-8001-000000000001',
  'Beginner Badminton',
  'Badminton',
  now() + interval '7 days',
  now() + interval '7 days',
  90,
  'scheduled'
on conflict (class_id, coach_user_id) do update set
  session_status = 'scheduled',
  effective_start = excluded.scheduled_start,
  updated_at = now();

delete from public.class_parent_notifications
where coach_user_id = 'd1000001-0001-4001-8001-000000000001';

delete from public.class_operation_audit
where coach_user_id = 'd1000001-0001-4001-8001-000000000001';
