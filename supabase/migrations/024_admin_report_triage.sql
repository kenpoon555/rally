-- Admin report triage: enriched queue + one-tap actions.

create or replace function public.admin_get_report_queue(p_limit int default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin is true) then
    raise exception 'Admin access required';
  end if;

  select coalesce(
    jsonb_agg(row_to_json(q)::jsonb order by q.created_at desc),
    '[]'::jsonb
  )
  into v_result
  from (
    select
      r.id,
      r.reporter_id,
      r.reported_id,
      r.reason,
      r.detail,
      r.context_type,
      r.context_id,
      r.status,
      r.created_at,
      rep.username as reporter_username,
      reported.username as reported_username,
      reported.is_suspended as reported_is_suspended,
      (
        select count(*)::int
        from public.user_reports ur
        where ur.reported_id = r.reported_id
          and ur.status = 'pending'
      ) as reported_pending_count
    from public.user_reports r
    join public.profiles rep on rep.id = r.reporter_id
    join public.profiles reported on reported.id = r.reported_id
    where r.status = 'pending'
    order by r.created_at desc
    limit greatest(1, least(p_limit, 200))
  ) q;

  return v_result;
end;
$$;

create or replace function public.admin_triage_report(
  p_report_id uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reported_id uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin is true) then
    raise exception 'Admin access required';
  end if;

  if p_action not in ('dismiss', 'reviewed', 'suspend', 'restore') then
    raise exception 'Invalid triage action';
  end if;

  select reported_id
  into v_reported_id
  from public.user_reports
  where id = p_report_id;

  if not found then
    raise exception 'Report not found';
  end if;

  if p_action = 'dismiss' then
    update public.user_reports
    set status = 'dismissed'
    where id = p_report_id;
    return;
  end if;

  if p_action = 'reviewed' then
    update public.user_reports
    set status = 'reviewed'
    where id = p_report_id;
    return;
  end if;

  if p_action = 'suspend' then
    update public.profiles
    set
      is_suspended = true,
      suspended_at = now(),
      updated_at = now()
    where id = v_reported_id;

    update public.user_reports
    set status = 'reviewed'
    where reported_id = v_reported_id
      and status = 'pending';
    return;
  end if;

  -- restore
  update public.profiles
  set
    is_suspended = false,
    suspended_at = null,
    updated_at = now()
  where id = v_reported_id;
end;
$$;

revoke all on function public.admin_get_report_queue(int) from public;
grant execute on function public.admin_get_report_queue(int) to authenticated;

revoke all on function public.admin_triage_report(uuid, text) from public;
grant execute on function public.admin_triage_report(uuid, text) to authenticated;
