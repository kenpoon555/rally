-- Coach / parent foundation: coach role flag for Profile Coach Tools (v1.1).

alter table public.profiles
  add column if not exists is_coach boolean not null default false;

create index if not exists idx_profiles_is_coach
  on public.profiles(is_coach)
  where is_coach = true;

insert into public.app_feature_flags (key, enabled, config)
values
  ('coach_classes_discover_v1', false, '{"description":"Play Classes segment"}'::jsonb),
  ('parent_family_ui_v1', false, '{"description":"Profile Family section"}'::jsonb),
  ('coach_dashboard_v1', false, '{"description":"Profile Coach Tools section"}'::jsonb),
  ('class_inbox_announce_v1', false, '{"description":"Inbox class announcements"}'::jsonb)
on conflict (key) do nothing;
