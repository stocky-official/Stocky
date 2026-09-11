-- Stocky assigned stock work.
-- Counts and expiry checks are tasks, not direct edits. Staff can read only
-- the products/lots they must inspect; expected values stay manager-only.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'stock_task_type') then
    create type public.stock_task_type as enum ('count', 'expiry');
  end if;
  if not exists (select 1 from pg_type where typname = 'stock_task_status') then
    create type public.stock_task_status as enum ('assigned', 'in_progress', 'submitted', 'approved', 'rejected', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'stock_task_item_status') then
    create type public.stock_task_item_status as enum ('pending', 'completed', 'approved');
  end if;
end
$$;

create table if not exists public.stock_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete restrict,
  task_type public.stock_task_type not null,
  title varchar(255) not null,
  status public.stock_task_status not null default 'assigned',
  assigned_to_company_user_id uuid not null references public.company_users(id) on delete restrict,
  created_by_company_user_id uuid references public.company_users(id) on delete set null,
  notes text,
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stock_tasks add column if not exists scheduled_start_at timestamptz;
alter table public.stock_tasks add column if not exists scheduled_end_at timestamptz;

create index if not exists stock_tasks_assignee_idx
  on public.stock_tasks(company_id, assigned_to_company_user_id, status, created_at desc);
create index if not exists stock_tasks_location_idx
  on public.stock_tasks(company_id, location_id, task_type, created_at desc);

create table if not exists public.stock_task_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete restrict,
  task_id uuid not null references public.stock_tasks(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  stock_lot_id uuid references public.stock_lots(id) on delete restrict,
  counted_quantity integer check (counted_quantity is null or counted_quantity >= 0),
  observed_expiry_date timestamptz,
  note text,
  status public.stock_task_item_status not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stock_task_items_task_idx
  on public.stock_task_items(task_id, status);
create unique index if not exists stock_task_items_product_idx
  on public.stock_task_items(task_id, product_id)
  where stock_lot_id is null;
create unique index if not exists stock_task_items_lot_idx
  on public.stock_task_items(task_id, stock_lot_id)
  where stock_lot_id is not null;

create table if not exists public.stock_task_expected (
  task_item_id uuid primary key references public.stock_task_items(id) on delete cascade,
  expected_quantity integer,
  expected_expiry_date timestamptz
);

create table if not exists public.stock_activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  actor_company_user_id uuid references public.company_users(id) on delete set null,
  actor_auth_user_id uuid,
  entity_type varchar(50) not null,
  entity_id uuid,
  action varchar(80) not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists stock_activity_logs_company_idx
  on public.stock_activity_logs(company_id, created_at desc);
create index if not exists stock_activity_logs_type_idx
  on public.stock_activity_logs(company_id, entity_type, created_at desc);

alter table public.stock_tasks enable row level security;
alter table public.stock_task_items enable row level security;
alter table public.stock_task_expected enable row level security;
alter table public.stock_activity_logs enable row level security;

drop policy if exists stock_tasks_select on public.stock_tasks;
create policy stock_tasks_select on public.stock_tasks
for select to authenticated
using (
  company_id = public.get_auth_company_id()
  and (
    public.is_company_admin()
    or public.can_manage_location(location_id)
    or exists (
      select 1 from public.company_users cu
       where cu.id = stock_tasks.assigned_to_company_user_id
         and cu.auth_user_id = auth.uid()
         and cu.status in ('active', 'invited')
    )
  )
);

drop policy if exists stock_task_items_select on public.stock_task_items;
create policy stock_task_items_select on public.stock_task_items
for select to authenticated
using (
  company_id = public.get_auth_company_id()
  and exists (
    select 1
      from public.stock_tasks t
     where t.id = stock_task_items.task_id
       and (
         public.is_company_admin()
         or public.can_manage_location(t.location_id)
         or exists (
           select 1 from public.company_users cu
            where cu.id = t.assigned_to_company_user_id
              and cu.auth_user_id = auth.uid()
              and cu.status in ('active', 'invited')
         )
       )
  )
);

drop policy if exists stock_task_expected_select on public.stock_task_expected;
create policy stock_task_expected_select on public.stock_task_expected
for select to authenticated
using (
  exists (
    select 1
      from public.stock_task_items i
     where i.id = stock_task_expected.task_item_id
       and i.company_id = public.get_auth_company_id()
       and (public.is_company_admin() or public.can_manage_location(i.location_id))
  )
);

drop policy if exists stock_activity_logs_select on public.stock_activity_logs;
create policy stock_activity_logs_select on public.stock_activity_logs
for select to authenticated
using (
  company_id = public.get_auth_company_id()
  and (
    public.is_company_admin()
    or (location_id is not null and public.can_access_location(location_id))
  )
);

-- All writes are performed by the command functions below. No direct insert,
-- update, or delete policies are intentionally exposed to the browser.
revoke all on public.stock_tasks, public.stock_task_items, public.stock_task_expected, public.stock_activity_logs from anon;
grant select on public.stock_tasks, public.stock_task_items, public.stock_task_expected, public.stock_activity_logs to authenticated;

drop function if exists public.create_stock_task(uuid, public.stock_task_type, uuid, jsonb, text);

create or replace function public.create_stock_task(
  p_location_id uuid,
  p_task_type public.stock_task_type,
  p_assigned_to_company_user_id uuid,
  p_product_ids jsonb,
  p_note text default null,
  p_scheduled_start_at timestamptz default null,
  p_scheduled_end_at timestamptz default null
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
  if jsonb_array_length(coalesce(p_product_ids, '[]'::jsonb)) = 0 then
    raise exception 'Select at least one product';
  end if;
  if p_scheduled_start_at is not null and p_scheduled_end_at is null then
    raise exception 'A scheduled end time is required';
  end if;
  if p_scheduled_start_at is not null and p_scheduled_end_at <= p_scheduled_start_at then
    raise exception 'The scheduled end time must be after the start time';
  end if;
  if exists (
    select value
      from jsonb_array_elements_text(p_product_ids) value
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

  insert into public.stock_tasks (
    company_id, location_id, task_type, title, assigned_to_company_user_id,
    created_by_company_user_id, notes, scheduled_start_at, scheduled_end_at
  ) values (
    company_id_value,
    p_location_id,
    p_task_type,
    case when p_task_type = 'count' then 'Count stock at ' || location_name_value else 'Check expiry dates at ' || location_name_value end,
    assigned_user.id,
    creator_id_value,
    nullif(trim(p_note), ''),
    p_scheduled_start_at,
    p_scheduled_end_at
  ) returning id into task_id_value;

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

  insert into public.stock_activity_logs (
    company_id, location_id, actor_company_user_id, actor_auth_user_id,
    entity_type, entity_id, action, summary, metadata
  ) values (
    company_id_value, p_location_id, creator_id_value, auth.uid(),
    'stock_task', task_id_value, 'created',
    case when p_task_type = 'count' then 'Stock count assigned' else 'Expiry audit assigned' end,
    jsonb_build_object('task_type', p_task_type, 'assigned_to_company_user_id', assigned_user.id, 'item_count', item_count)
  );
  return task_id_value;
end;
$$;

revoke all on function public.create_stock_task(uuid, public.stock_task_type, uuid, jsonb, text, timestamptz, timestamptz) from public;
grant execute on function public.create_stock_task(uuid, public.stock_task_type, uuid, jsonb, text, timestamptz, timestamptz) to authenticated;

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
        where cu.id = t.assigned_to_company_user_id
          and cu.auth_user_id = auth.uid()
          and cu.status = 'active'
     )
   for update;
  if task_row.id is null then raise exception 'This task is not assigned to you'; end if;
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
        where cu.id = t.assigned_to_company_user_id
          and cu.auth_user_id = auth.uid()
          and cu.status = 'active'
     )
   for update;
  if task_row.id is null then raise exception 'This task is not assigned to you'; end if;
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
    if line is null then raise exception 'A task item is missing from the submission'; end if;

    if task_row.task_type = 'count' then
      counted_value := (line->>'counted_quantity')::integer;
      if counted_value is null or counted_value < 0 then raise exception 'Enter a valid quantity for every item'; end if;
      update public.stock_task_items
         set counted_quantity = counted_value, note = nullif(trim(line->>'note'), ''), status = 'completed', completed_at = now(), updated_at = now()
       where id = item_row.id;
    else
      observed_date_value := nullif(trim(line->>'observed_expiry_date'), '')::timestamptz;
      note_value := nullif(trim(line->>'note'), '');
      if observed_date_value is null and note_value is null then raise exception 'Add a note when an expiry date is missing'; end if;
      update public.stock_task_items
         set observed_expiry_date = observed_date_value, note = note_value, status = 'completed', completed_at = now(), updated_at = now()
       where id = item_row.id;
    end if;
  end loop;

  update public.stock_tasks
     set status = 'submitted', submitted_at = now(), updated_at = now()
   where id = task_row.id
  returning * into task_row;

  insert into public.stock_activity_logs (company_id, location_id, actor_company_user_id, actor_auth_user_id, entity_type, entity_id, action, summary)
  select task_row.company_id, task_row.location_id, cu.id, auth.uid(), 'stock_task', task_row.id, 'submitted',
         case when task_row.task_type = 'count' then 'Stock count submitted' else 'Expiry audit submitted' end
    from public.company_users cu where cu.auth_user_id = auth.uid() and cu.company_id = task_row.company_id limit 1;
  return task_row;
end;
$$;

revoke all on function public.submit_stock_task(uuid, jsonb) from public;
grant execute on function public.submit_stock_task(uuid, jsonb) to authenticated;

create or replace function public.review_stock_task(p_task_id uuid, p_approve boolean, p_note text default null)
returns public.stock_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row public.stock_tasks;
  task_item_row public.stock_task_items;
  expected_row public.stock_task_expected;
  lot_row public.stock_lots;
  company_user_id_value uuid;
  delta_value integer;
  remaining_value integer;
  take_value integer;
begin
  select * into task_row
    from public.stock_tasks
   where id = p_task_id
     and company_id = public.get_auth_company_id()
   for update;
  if task_row.id is null or not public.can_manage_location(task_row.location_id) then raise exception 'Task not found'; end if;
  if task_row.status <> 'submitted' then raise exception 'Only submitted tasks can be reviewed'; end if;
  select id into company_user_id_value from public.company_users where company_id = task_row.company_id and auth_user_id = auth.uid() and status = 'active' limit 1;

  if not p_approve then
    update public.stock_tasks set status = 'rejected', notes = coalesce(nullif(trim(p_note), ''), notes), reviewed_at = now(), updated_at = now() where id = task_row.id returning * into task_row;
    insert into public.stock_activity_logs (company_id, location_id, actor_company_user_id, actor_auth_user_id, entity_type, entity_id, action, summary, metadata)
    values (task_row.company_id, task_row.location_id, company_user_id_value, auth.uid(), 'stock_task', task_row.id, 'rejected', 'Stock task sent back for correction', jsonb_build_object('note', p_note));
    return task_row;
  end if;

  for task_item_row in select * from public.stock_task_items where task_id = task_row.id for update loop
    if task_row.task_type = 'count' then
      select * into expected_row from public.stock_task_expected where task_item_id = task_item_row.id;
      delta_value := coalesce(task_item_row.counted_quantity, 0) - coalesce(expected_row.expected_quantity, 0);
      if delta_value > 0 then
        select * into lot_row
          from public.stock_lots
         where company_id = task_row.company_id and location_id = task_row.location_id and product_id = task_item_row.product_id and status = 'available'
         order by expiry_date nulls last, received_at
         limit 1 for update;
        if lot_row.id is null then
          insert into public.stock_lots (company_id, product_id, location_id, lot_number, quantity_on_hand, unit_cost, status, notes)
          values (task_row.company_id, task_item_row.product_id, task_row.location_id, 'count-' || left(task_row.id::text, 8), 0, 0, 'available', 'Created by approved stock task')
          returning * into lot_row;
        end if;
        update public.stock_lots set quantity_on_hand = quantity_on_hand + delta_value, updated_at = now() where id = lot_row.id;
        insert into public.stock_movements (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by_auth_user_id)
        values (task_row.company_id, task_item_row.product_id, lot_row.id, task_row.location_id, 'count_adjustment', delta_value, 'stock_task', task_row.id, 'Approved stock count difference', auth.uid());
      elsif delta_value < 0 then
        remaining_value := abs(delta_value);
        for lot_row in
          select * from public.stock_lots
           where company_id = task_row.company_id and location_id = task_row.location_id and product_id = task_item_row.product_id and quantity_on_hand > 0
           order by expiry_date nulls first, received_at
           for update
        loop
          exit when remaining_value <= 0;
          take_value := least(remaining_value, lot_row.quantity_on_hand);
          update public.stock_lots set quantity_on_hand = quantity_on_hand - take_value, status = case when quantity_on_hand - take_value = 0 then 'depleted'::public.stock_lot_status else status end, updated_at = now() where id = lot_row.id;
          insert into public.stock_movements (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by_auth_user_id)
          values (task_row.company_id, task_item_row.product_id, lot_row.id, task_row.location_id, 'count_adjustment', -take_value, 'stock_task', task_row.id, 'Approved stock count difference', auth.uid());
          remaining_value := remaining_value - take_value;
        end loop;
      end if;
    else
      if task_item_row.stock_lot_id is not null then
        update public.stock_lots
           set expiry_date = task_item_row.observed_expiry_date, notes = coalesce(task_item_row.note, notes), updated_at = now()
         where id = task_item_row.stock_lot_id and company_id = task_row.company_id;
      end if;
    end if;
    update public.stock_task_items set status = 'approved', updated_at = now() where id = task_item_row.id;
  end loop;

  update public.stock_tasks set status = 'approved', notes = coalesce(nullif(trim(p_note), ''), notes), reviewed_at = now(), updated_at = now() where id = task_row.id returning * into task_row;
  insert into public.stock_activity_logs (company_id, location_id, actor_company_user_id, actor_auth_user_id, entity_type, entity_id, action, summary, metadata)
  values (task_row.company_id, task_row.location_id, company_user_id_value, auth.uid(), 'stock_task', task_row.id, 'approved', 'Stock task approved', jsonb_build_object('note', p_note));
  return task_row;
end;
$$;

revoke all on function public.review_stock_task(uuid, boolean, text) from public;
grant execute on function public.review_stock_task(uuid, boolean, text) to authenticated;

-- Keep ordinary stock changes visible in the same activity feed as task work.
create or replace function public.record_stock_activity_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  company_user_id_value uuid;
  location_id_value uuid;
  entity_type_value text;
  action_value text;
  summary_value text;
begin
  select id into company_user_id_value from public.company_users where auth_user_id = auth.uid() and company_id = new.company_id limit 1;
  if tg_table_name = 'stock_movements' then
    location_id_value := new.location_id;
    entity_type_value := 'stock_movement';
    action_value := new.movement_type::text;
    summary_value := format('Stock movement: %s (%s%s)', replace(new.movement_type::text, '_', ' '), case when new.quantity_delta >= 0 then '+' else '' end, new.quantity_delta);
  elsif tg_table_name = 'stock_transfers' then
    location_id_value := new.source_location_id;
    entity_type_value := 'transfer';
    action_value := new.status::text;
    summary_value := 'Transfer ' || replace(new.status::text, '_', ' ');
  else
    location_id_value := new.location_id;
    entity_type_value := 'supplier_request';
    action_value := new.status::text;
    summary_value := 'Supplier request ' || replace(new.status::text, '_', ' ');
  end if;

  insert into public.stock_activity_logs (company_id, location_id, actor_company_user_id, actor_auth_user_id, entity_type, entity_id, action, summary, metadata)
  values (new.company_id, location_id_value, company_user_id_value, auth.uid(), entity_type_value, new.id, action_value, summary_value, jsonb_build_object('source_table', tg_table_name));
  return new;
end;
$$;

drop trigger if exists stock_movements_activity_log on public.stock_movements;
create trigger stock_movements_activity_log
after insert on public.stock_movements
for each row execute function public.record_stock_activity_log();

drop trigger if exists stock_transfers_activity_log on public.stock_transfers;
create trigger stock_transfers_activity_log
after insert or update of status on public.stock_transfers
for each row execute function public.record_stock_activity_log();

drop trigger if exists supplier_requests_activity_log on public.supplier_requests;
create trigger supplier_requests_activity_log
after insert or update of status on public.supplier_requests
for each row execute function public.record_stock_activity_log();
