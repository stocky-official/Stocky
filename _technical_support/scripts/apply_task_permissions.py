import os
import psycopg2

DB_URL = "postgresql://postgres.qrxrvfchqxwvfwmszssm:RvDVMIOBshEdzXTE@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

sql_commands = """
create or replace function public.start_stock_task(p_task_id uuid)
returns public.stock_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row public.stock_tasks;
begin
  select * into task_row
    from public.stock_tasks t
   where t.id = p_task_id
     and t.company_id = public.get_auth_company_id()
     and exists (
       select 1 from public.company_users cu
        where cu.company_id = t.company_id
          and cu.auth_user_id = auth.uid()
          and cu.status = 'active'
          and (
            cu.id = t.assigned_to_company_user_id
            or cu.role in ('owner', 'admin', 'manager')
          )
     )
   for update;
  if task_row.id is null then raise exception 'This task is not assigned to you or you lack permission'; end if;
  if task_row.status in ('assigned', 'rejected') then
    update public.stock_tasks
       set status = 'in_progress', started_at = now(), updated_at = now()
     where id = task_row.id
    returning * into task_row;
    insert into public.stock_activity_logs (company_id, location_id, actor_company_user_id, actor_auth_user_id, entity_type, entity_id, action, summary)
    select task_row.company_id, task_row.location_id, cu.id, auth.uid(), 'stock_task', task_row.id, 'started', 'Stock task started'
      from public.company_users cu where cu.auth_user_id = auth.uid() and cu.company_id = task_row.company_id limit 1;
  elsif task_row.status <> 'in_progress' then
    raise exception 'This task is no longer available';
  end if;
  return task_row;
end;
$$;

revoke all on function public.start_stock_task(uuid) from public;
grant execute on function public.start_stock_task(uuid) to authenticated;

create or replace function public.submit_stock_task(p_task_id uuid, p_items jsonb)
returns public.stock_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row public.stock_tasks;
  item_row public.stock_task_items;
  line jsonb;
  counted_value integer;
  observed_date_value timestamptz;
  note_value text;
  item_count integer;
begin
  select * into task_row
    from public.stock_tasks t
   where t.id = p_task_id
     and t.company_id = public.get_auth_company_id()
     and exists (
       select 1 from public.company_users cu
        where cu.company_id = t.company_id
          and cu.auth_user_id = auth.uid()
          and cu.status = 'active'
          and (
            cu.id = t.assigned_to_company_user_id
            or cu.role in ('owner', 'admin', 'manager')
          )
     )
   for update;
  if task_row.id is null then raise exception 'This task is not assigned to you or you lack permission'; end if;
  if task_row.status not in ('assigned', 'in_progress', 'rejected') then raise exception 'This task is already submitted'; end if;
  if task_row.status in ('assigned', 'rejected') then
    update public.stock_tasks set status = 'in_progress', started_at = coalesce(started_at, now()), updated_at = now() where id = task_row.id;
  end if;

  select count(*) into item_count from public.stock_task_items where task_id = task_row.id;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) <> item_count then
    raise exception 'Complete every item before submitting this task';
  end if;

  for item_row in select * from public.stock_task_items where task_id = task_row.id for update loop
    select value into line
      from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) value
     where value->>'task_item_id' = item_row.id::text
     limit 1;
    if line is null then
      raise exception 'Missing data for item %', item_row.id;
    end if;

    counted_value := null;
    if line ? 'counted_quantity' and line->>'counted_quantity' is not null and line->>'counted_quantity' <> '' then
      counted_value := (line->>'counted_quantity')::integer;
      if counted_value < 0 then
        raise exception 'Counted quantity cannot be negative';
      end if;
    end if;

    observed_date_value := null;
    if line ? 'observed_expiry_date' and line->>'observed_expiry_date' is not null and line->>'observed_expiry_date' <> '' then
      observed_date_value := (line->>'observed_expiry_date')::timestamptz;
    end if;

    note_value := nullif(trim(coalesce(line->>'note', '')), '');

    update public.stock_task_items
       set counted_quantity = counted_value,
           observed_expiry_date = observed_date_value,
           note = note_value,
           status = 'counted',
           updated_at = now()
     where id = item_row.id;
  end loop;

  update public.stock_tasks
     set status = 'submitted', submitted_at = now(), updated_at = now()
   where id = task_row.id
  returning * into task_row;

  insert into public.stock_activity_logs (company_id, location_id, actor_company_user_id, actor_auth_user_id, entity_type, entity_id, action, summary)
  select task_row.company_id, task_row.location_id, cu.id, auth.uid(), 'stock_task', task_row.id, 'submitted', 'Stock task submitted for review'
    from public.company_users cu where cu.auth_user_id = auth.uid() and cu.company_id = task_row.company_id limit 1;

  return task_row;
end;
$$;

revoke all on function public.submit_stock_task(uuid, jsonb) from public;
grant execute on function public.submit_stock_task(uuid, jsonb) to authenticated;
"""

conn = psycopg2.connect(DB_URL, sslmode='require')
cur = conn.cursor()
cur.execute(sql_commands)
conn.commit()
print("Migration applied successfully!")
cur.close()
conn.close()
