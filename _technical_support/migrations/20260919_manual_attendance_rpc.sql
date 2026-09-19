-- Migration: 20260919_manual_attendance_rpc.sql
-- Description: RPC function allowing managers/admins to manually record attendance shifts for employees (e.g. when QR code scanner is unavailable)

create or replace function public.record_manual_attendance(
  p_company_user_id uuid,
  p_location_id uuid,
  p_shift_date date,
  p_clock_in_at timestamptz,
  p_clock_out_at timestamptz default null,
  p_status text default 'present',
  p_notes text default null
)
returns public.attendance_shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_actor_user_id uuid;
  v_actor_role text;
  v_target_user record;
  v_result public.attendance_shifts;
  v_minutes integer := null;
  v_status text;
begin
  v_company_id := public.get_auth_company_id();
  if v_company_id is null then
    raise exception 'Company context not found';
  end if;

  select id, role into v_actor_user_id, v_actor_role from public.company_users
   where auth_user_id = auth.uid() and company_id = v_company_id and status = 'active'
   limit 1;
  if v_actor_user_id is null then
    raise exception 'Active company user not found';
  end if;

  -- Ensure actor is a manager/admin OR is logging their own attendance
  if v_actor_role not in ('owner', 'admin', 'manager') and v_actor_user_id <> p_company_user_id then
    raise exception 'Only managers or admins can log attendance for other team members';
  end if;

  -- Verify target user belongs to same company
  select id, full_name, email into v_target_user from public.company_users
   where id = p_company_user_id and company_id = v_company_id and status = 'active'
   limit 1;
  if v_target_user.id is null then
    raise exception 'Target team member not found or inactive';
  end if;

  -- Calculate minutes if clock out is provided
  if p_clock_out_at is not null then
    if p_clock_out_at < p_clock_in_at then
      raise exception 'Clock out time cannot be earlier than clock in time';
    end if;
    v_minutes := greatest(1, extract(epoch from (p_clock_out_at - p_clock_in_at)) / 60)::integer;
  end if;

  v_status := coalesce(p_status, 'present');

  insert into public.attendance_shifts (
    company_id,
    location_id,
    company_user_id,
    shift_date,
    clock_in_at,
    clock_out_at,
    total_minutes,
    status,
    punch_in_method,
    punch_out_method,
    notes
  ) values (
    v_company_id,
    p_location_id,
    p_company_user_id,
    p_shift_date,
    p_clock_in_at,
    p_clock_out_at,
    v_minutes,
    v_status,
    'manual',
    case when p_clock_out_at is not null then 'manual' else null end,
    p_notes
  ) returning * into v_result;

  insert into public.stock_activity_logs (
    company_id,
    location_id,
    actor_company_user_id,
    actor_auth_user_id,
    entity_type,
    entity_id,
    action,
    summary
  ) values (
    v_company_id,
    p_location_id,
    v_actor_user_id,
    auth.uid(),
    'attendance',
    v_result.id,
    'manual_entry',
    'Manual attendance logged for ' || coalesce(v_target_user.full_name, v_target_user.email, 'employee')
  );

  return v_result;
end;
$$;

revoke all on function public.record_manual_attendance(uuid, uuid, date, timestamptz, timestamptz, text, text) from public;
grant execute on function public.record_manual_attendance(uuid, uuid, date, timestamptz, timestamptz, text, text) to authenticated;
