-- Coach-published classes (v1.2) — distinct from pickup activities.

create table if not exists public.coach_class_listings (
  id text primary key,
  coach_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  sport_type text not null,
  location_name text not null,
  start_time timestamptz not null,
  duration_minutes integer not null default 90 check (duration_minutes > 0),
  enrolled_count integer not null default 0 check (enrolled_count >= 0),
  confirmed_count integer not null default 0 check (confirmed_count >= 0),
  fee_note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_coach_class_listings_coach
  on public.coach_class_listings(coach_user_id, start_time desc);

alter table public.coach_class_listings enable row level security;

drop policy if exists "Coaches manage own class listings" on public.coach_class_listings;
create policy "Coaches manage own class listings"
  on public.coach_class_listings
  for all
  using (coach_user_id = auth.uid())
  with check (coach_user_id = auth.uid());

drop policy if exists "Authenticated read coach class listings" on public.coach_class_listings;
create policy "Authenticated read coach class listings"
  on public.coach_class_listings
  for select
  using (auth.uid() is not null);
