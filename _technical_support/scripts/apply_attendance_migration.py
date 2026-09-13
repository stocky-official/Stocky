import psycopg2

DB_URL = "postgresql://postgres.qrxrvfchqxwvfwmszssm:RvDVMIOBshEdzXTE@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

sql_commands = """
-- 1. Locations QR secret token
alter table public.locations add column if not exists qr_code_token text default encode(gen_random_bytes(16), 'hex');

-- Update any null qr_code_token
update public.locations set qr_code_token = encode(gen_random_bytes(16), 'hex') where qr_code_token is null;

-- 2. Attendance Shifts Table
create table if not exists public.attendance_shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete restrict,
  company_user_id uuid not null references public.company_users(id) on delete cascade,
  shift_date date not null default current_date,
  clock_in_at timestamptz not null default now(),
  clock_out_at timestamptz,
  total_minutes integer,
  status text not null default 'present' check (status in ('present', 'late', 'early_departure', 'overtime', 'incomplete')),
  punch_in_method text not null default 'qr_scan' check (punch_in_method in ('qr_scan', 'kiosk', 'manual')),
  punch_out_method text check (punch_out_method in ('qr_scan', 'kiosk', 'manual')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Leave Requests Table
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  company_user_id uuid not null references public.company_users(id) on delete cascade,
  approver_company_user_id uuid not null references public.company_users(id) on delete restrict,
  task_id uuid references public.stock_tasks(id) on delete set null,
  leave_type text not null default 'pto' check (leave_type in ('pto', 'sick', 'emergency', 'unpaid')),
  start_date date not null,
  end_date date not null,
  days_count numeric(4,1) not null default 1,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  manager_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Leave Balances Table
create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  company_user_id uuid not null references public.company_users(id) on delete cascade,
  year integer not null default extract(year from current_date),
  pto_allowance integer not null default 21,
  pto_used numeric(4,1) not null default 0,
  sick_allowance integer not null default 10,
  sick_used numeric(4,1) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, company_user_id, year)
);

-- 5. RLS Policies
alter table public.attendance_shifts enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_balances enable row level security;

drop policy if exists "attendance_shifts_company_policy" on public.attendance_shifts;
create policy "attendance_shifts_company_policy" on public.attendance_shifts
  using (company_id = public.get_auth_company_id());

drop policy if exists "leave_requests_company_policy" on public.leave_requests;
create policy "leave_requests_company_policy" on public.leave_requests
  using (company_id = public.get_auth_company_id());

drop policy if exists "leave_balances_company_policy" on public.leave_balances;
create policy "leave_balances_company_policy" on public.leave_balances
  using (company_id = public.get_auth_company_id());

-- 6. RPC: Punch Attendance (Clock In / Out)
create or replace function public.punch_attendance(
  p_location_id uuid,
  p_qr_token text default null,
  p_method text default 'qr_scan',
  p_notes text default null
)
returns public.attendance_shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_user_id uuid;
  v_location public.locations;
  v_open_shift public.attendance_shifts;
  v_result public.attendance_shifts;
  v_minutes integer;
begin
  v_company_id := public.get_auth_company_id();
  if v_company_id is null then
    raise exception 'Company context not found';
  end if;

  select id into v_user_id from public.company_users
   where auth_user_id = auth.uid() and company_id = v_company_id and status = 'active'
   limit 1;
  if v_user_id is null then
    raise exception 'Active company user not found';
  end if;

  select * into v_location from public.locations where id = p_location_id and company_id = v_company_id;
  if v_location.id is null then
    raise exception 'Location not found';
  end if;

  -- Check if user has an active shift today
  select * into v_open_shift
    from public.attendance_shifts
   where company_user_id = v_user_id
     and clock_out_at is null
   order by clock_in_at desc
   limit 1
   for update;

  if v_open_shift.id is not null then
    -- CLOCK OUT
    v_minutes := greatest(1, extract(epoch from (now() - v_open_shift.clock_in_at)) / 60)::integer;
    update public.attendance_shifts
       set clock_out_at = now(),
           total_minutes = v_minutes,
           punch_out_method = p_method,
           updated_at = now()
     where id = v_open_shift.id
    returning * into v_result;

    insert into public.stock_activity_logs (company_id, location_id, actor_company_user_id, actor_auth_user_id, entity_type, entity_id, action, summary)
    values (v_company_id, v_result.location_id, v_user_id, auth.uid(), 'attendance', v_result.id, 'clock_out', 'Employee clocked out from shift');

  else
    -- CLOCK IN
    insert into public.attendance_shifts (
      company_id,
      location_id,
      company_user_id,
      shift_date,
      clock_in_at,
      status,
      punch_in_method,
      notes
    ) values (
      v_company_id,
      p_location_id,
      v_user_id,
      current_date,
      now(),
      case when extract(hour from now()) >= 9 and extract(minute from now()) > 15 then 'late' else 'present' end,
      p_method,
      p_notes
    ) returning * into v_result;

    insert into public.stock_activity_logs (company_id, location_id, actor_company_user_id, actor_auth_user_id, entity_type, entity_id, action, summary)
    values (v_company_id, v_result.location_id, v_user_id, auth.uid(), 'attendance', v_result.id, 'clock_in', 'Employee clocked in to shift');

  end if;

  return v_result;
end;
$$;

revoke all on function public.punch_attendance(uuid, text, text, text) from public;
grant execute on function public.punch_attendance(uuid, text, text, text) to authenticated;

-- 7. RPC: Submit Leave Request
create or replace function public.submit_leave_request(
  p_leave_type text,
  p_start_date date,
  p_end_date date,
  p_days_count numeric,
  p_manager_user_id uuid,
  p_reason text
)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_user_id uuid;
  v_user_name text;
  v_default_loc uuid;
  v_task_id uuid;
  v_leave public.leave_requests;
begin
  v_company_id := public.get_auth_company_id();
  if v_company_id is null then raise exception 'Company context not found'; end if;

  select id, coalesce(full_name, email) into v_user_id, v_user_name
    from public.company_users
   where auth_user_id = auth.uid() and company_id = v_company_id and status = 'active'
   limit 1;
  if v_user_id is null then raise exception 'Active company user not found'; end if;

  select id into v_default_loc from public.locations where company_id = v_company_id and is_active = true limit 1;

  -- Create Leave Request
  insert into public.leave_requests (
    company_id,
    company_user_id,
    approver_company_user_id,
    leave_type,
    start_date,
    end_date,
    days_count,
    reason,
    status
  ) values (
    v_company_id,
    v_user_id,
    p_manager_user_id,
    p_leave_type,
    p_start_date,
    p_end_date,
    p_days_count,
    p_reason,
    'pending'
  ) returning * into v_leave;

  -- Create corresponding Stock Task for Manager Review
  if v_default_loc is not null then
    insert into public.stock_tasks (
      company_id,
      location_id,
      task_type,
      title,
      status,
      assigned_to_company_user_id,
      created_by_company_user_id,
      notes,
      scheduled_start_at,
      scheduled_end_at,
      submitted_at
    ) values (
      v_company_id,
      v_default_loc,
      'count',
      '[' || upper(p_leave_type) || ' Request] ' || v_user_name || ' (' || to_char(p_start_date, 'Mon DD') || ' - ' || to_char(p_end_date, 'Mon DD') || ')',
      'submitted',
      p_manager_user_id,
      v_user_id,
      'Leave Type: ' || upper(p_leave_type) || E'\\nDuration: ' || p_days_count || ' day(s)' || E'\\nReason: ' || coalesce(p_reason, 'No note provided'),
      p_start_date,
      p_end_date,
      now()
    ) returning id into v_task_id;

    update public.leave_requests set task_id = v_task_id where id = v_leave.id;
    v_leave.task_id := v_task_id;
  end if;

  return v_leave;
end;
$$;

revoke all on function public.submit_leave_request(text, date, date, numeric, uuid, text) from public;
grant execute on function public.submit_leave_request(text, date, date, numeric, uuid, text) to authenticated;

-- 8. RPC: Review Leave Request
create or replace function public.review_leave_request(
  p_request_id uuid,
  p_approve boolean,
  p_manager_note text default null
)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_leave public.leave_requests;
begin
  v_company_id := public.get_auth_company_id();
  select * into v_leave from public.leave_requests where id = p_request_id and company_id = v_company_id for update;
  if v_leave.id is null then raise exception 'Leave request not found'; end if;

  update public.leave_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         manager_note = p_manager_note,
         reviewed_at = now(),
         updated_at = now()
   where id = v_leave.id
  returning * into v_leave;

  -- Update leave balances if approved
  if p_approve then
    insert into public.leave_balances (company_id, company_user_id, year, pto_allowance, pto_used, sick_allowance, sick_used)
    values (
      v_company_id,
      v_leave.company_user_id,
      extract(year from v_leave.start_date)::integer,
      21,
      case when v_leave.leave_type = 'pto' then v_leave.days_count else 0 end,
      10,
      case when v_leave.leave_type = 'sick' then v_leave.days_count else 0 end
    )
    on conflict (company_id, company_user_id, year) do update
    set pto_used = leave_balances.pto_used + (case when v_leave.leave_type = 'pto' then v_leave.days_count else 0 end),
        sick_used = leave_balances.sick_used + (case when v_leave.leave_type = 'sick' then v_leave.days_count else 0 end),
        updated_at = now();
  end if;

  -- Sync associated task if exists
  if v_leave.task_id is not null then
    update public.stock_tasks
       set status = case when p_approve then 'approved' else 'rejected' end,
           reviewed_at = now(),
           updated_at = now()
     where id = v_leave.task_id;
  end if;

  return v_leave;
end;
$$;

revoke all on function public.review_leave_request(uuid, boolean, text) from public;
grant execute on function public.review_leave_request(uuid, boolean, text) to authenticated;
"""

conn = psycopg2.connect(DB_URL, sslmode='require')
cur = conn.cursor()
cur.execute(sql_commands)
conn.commit()
print("Attendance database tables and RPCs created successfully!")
cur.close()
conn.close()
