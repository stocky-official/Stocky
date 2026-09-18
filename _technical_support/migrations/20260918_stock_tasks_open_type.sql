-- Migration: 20260918_stock_tasks_open_type.sql
-- Description: Add 'open' to stock_task_type enum and support open tasks and custom task titles in create_stock_task RPC

alter type public.stock_task_type add value if not exists 'open';

drop function if exists public.create_stock_task(uuid, public.stock_task_type, uuid, jsonb, text, timestamptz, timestamptz);
drop function if exists public.create_stock_task(uuid, public.stock_task_type, uuid, jsonb, text, timestamptz, timestamptz, text);

create or replace function public.create_stock_task(
  p_location_id uuid,
  p_task_type public.stock_task_type,
  p_assigned_to_company_user_id uuid,
  p_product_ids jsonb default '[]'::jsonb,
  p_note text default null,
  p_scheduled_start_at timestamptz default null,
  p_scheduled_end_at timestamptz default null,
  p_title text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  company_id_value uuid;
  creator_id_value uuid;
  assigned_user record;
  location_name_value text;
  product_id_value uuid;
  lot_row record;
  task_id_value uuid;
  task_item_id_value uuid;
  item_count integer := 0;
  expected_quantity_value integer;
  task_title_value text;
begin
  company_id_value := public.get_auth_company_id();
  select id into creator_id_value
    from public.company_users
   where company_id = company_id_value
     and auth_user_id = auth.uid()
     and status = 'active'
   limit 1;

  if company_id_value is null then raise exception 'Company membership not found'; end if;
  if not public.can_manage_location(p_location_id) and not public.is_company_admin() then
    raise exception 'You cannot create work for this location';
  end if;

  if p_task_type <> 'open' and jsonb_array_length(coalesce(p_product_ids, '[]'::jsonb)) = 0 then
    raise exception 'Select at least one product';
  end if;

  if p_scheduled_start_at is not null and p_scheduled_end_at is null then
    raise exception 'A scheduled end time is required';
  end if;
  if p_scheduled_start_at is not null and p_scheduled_end_at <= p_scheduled_start_at then
    raise exception 'The scheduled end time must be after the start time';
  end if;

  if p_task_type <> 'open' and exists (
    select value
      from jsonb_array_elements_text(coalesce(p_product_ids, '[]'::jsonb)) value
     group by value
    having count(*) > 1
  ) then raise exception 'A product can only be selected once'; end if;

  select cu.* into assigned_user
    from public.company_users cu
   where cu.id = p_assigned_to_company_user_id
     and cu.company_id = company_id_value
     and cu.role in ('manager', 'staff')
     and cu.status in ('active', 'invited');
  if assigned_user.id is null then raise exception 'Choose an active manager or staff member'; end if;

  if not public.is_company_admin()
     and assigned_user.role = 'staff'
     and not exists (
       select 1 from public.user_locations ul
        where ul.user_id = assigned_user.id
          and ul.location_id = p_location_id
     ) then
    raise exception 'That staff member is not assigned to this location';
  end if;

  select name into location_name_value from public.locations where id = p_location_id and company_id = company_id_value and is_active;
  if location_name_value is null then raise exception 'Location not found'; end if;

  task_title_value := case
    when p_title is not null and trim(p_title) <> '' then trim(p_title)
    when p_task_type = 'count' then 'Count stock at ' || location_name_value
    when p_task_type = 'expiry' then 'Check expiry dates at ' || location_name_value
    else 'Task at ' || location_name_value
  end;

  insert into public.stock_tasks (
    company_id, location_id, task_type, title, assigned_to_company_user_id,
    created_by_company_user_id, notes, scheduled_start_at, scheduled_end_at
  ) values (
    company_id_value,
    p_location_id,
    p_task_type,
    task_title_value,
    assigned_user.id,
    creator_id_value,
    nullif(trim(p_note), ''),
    p_scheduled_start_at,
    p_scheduled_end_at
  ) returning id into task_id_value;

  if p_task_type in ('count', 'expiry') then
    for product_id_value in select value::uuid from jsonb_array_elements_text(p_product_ids) value loop
      if not exists (select 1 from public.products where id = product_id_value and company_id = company_id_value and is_active) then
        raise exception 'Selected product is not available in this company';
      end if;

      if p_task_type = 'count' then
        select coalesce(sum(quantity_on_hand), 0)::integer into expected_quantity_value
          from public.stock_lots
         where company_id = company_id_value
           and location_id = p_location_id
           and product_id = product_id_value
           and quantity_on_hand > 0;

        insert into public.stock_task_items (company_id, location_id, task_id, product_id)
        values (company_id_value, p_location_id, task_id_value, product_id_value)
        returning id into task_item_id_value;
        insert into public.stock_task_expected (task_item_id, expected_quantity)
        values (task_item_id_value, expected_quantity_value);
        item_count := item_count + 1;
      else
        for lot_row in
          select id, expiry_date
            from public.stock_lots
           where company_id = company_id_value
             and location_id = p_location_id
             and product_id = product_id_value
             and quantity_on_hand > 0
             and status not in ('disposed', 'returned', 'depleted')
        loop
          insert into public.stock_task_items (company_id, location_id, task_id, product_id, stock_lot_id)
          values (company_id_value, p_location_id, task_id_value, product_id_value, lot_row.id)
          returning id into task_item_id_value;
          insert into public.stock_task_expected (task_item_id, expected_expiry_date)
          values (task_item_id_value, lot_row.expiry_date);
          item_count := item_count + 1;
        end loop;
      end if;
    end loop;

    if item_count = 0 then
      delete from public.stock_tasks where id = task_id_value;
      raise exception 'No stock was found for the selected products at this location';
    end if;
  end if;

  insert into public.stock_activity_logs (
    company_id, location_id, actor_company_user_id, actor_auth_user_id,
    entity_type, entity_id, action, summary, metadata
  ) values (
    company_id_value, p_location_id, creator_id_value, auth.uid(),
    'stock_task', task_id_value, 'created',
    case
      when p_task_type = 'count' then 'Count assigned'
      when p_task_type = 'expiry' then 'Expiry audit assigned'
      else 'Task assigned: ' || task_title_value
    end,
    jsonb_build_object('task_type', p_task_type, 'title', task_title_value, 'assigned_to_company_user_id', assigned_user.id)
  );

  return task_id_value;
end;
$$;

revoke all on function public.create_stock_task(uuid, public.stock_task_type, uuid, jsonb, text, timestamptz, timestamptz, text) from public;
grant execute on function public.create_stock_task(uuid, public.stock_task_type, uuid, jsonb, text, timestamptz, timestamptz, text) to authenticated;
