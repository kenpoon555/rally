-- Joiners (approved) can view activities they participated in, including completed games.

drop policy if exists "Anyone can view active activities" on public.activities;
create policy "Anyone can view active activities"
  on public.activities
  for select
  using (
    status = 'active'
    or user_id = auth.uid()
    or exists (
      select 1
      from public.join_requests jr
      where jr.activity_id = activities.id
        and jr.user_id = auth.uid()
        and jr.status = 'approved'
    )
  );
