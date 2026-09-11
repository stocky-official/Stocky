-- Stocky product redesign domain.
-- This migration is additive: it preserves existing auth and MVP business rows
-- while creating the product/location/lot model and backfilling a usable copy.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'location_type') then
    create type public.location_type as enum ('warehouse', 'branch');
  end if;
  if not exists (select 1 from pg_type where typname = 'stock_lot_status') then
    create type public.stock_lot_status as enum ('available', 'on_hold', 'expired', 'depleted', 'returned', 'disposed');
  end if;
  if not exists (select 1 from pg_type where typname = 'stock_movement_type') then
    create type public.stock_movement_type as enum ('opening_balance', 'receive', 'count_adjustment', 'transfer_out', 'transfer_in', 'return_to_supplier', 'disposal', 'correction');
  end if;
  if not exists (select 1 from pg_type where typname = 'stock_count_status') then
    create type public.stock_count_status as enum ('open', 'submitted', 'approved', 'rejected', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'stock_count_line_status') then
    create type public.stock_count_line_status as enum ('pending', 'matched', 'variance', 'approved');
  end if;
  if not exists (select 1 from pg_type where typname = 'inventory_transfer_status') then
    create type public.inventory_transfer_status as enum ('draft', 'requested', 'approved', 'in_transit', 'partially_received', 'received', 'rejected', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'supplier_request_type') then
    create type public.supplier_request_type as enum ('replenish', 'return', 'replace');
  end if;
  if not exists (select 1 from pg_type where typname = 'supplier_request_status') then
    create type public.supplier_request_status as enum ('open', 'contacted', 'ordered', 'received', 'closed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum ('expiry', 'low_stock', 'transfer', 'count_review', 'supplier_request', 'data_quality');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_severity') then
    create type public.notification_severity as enum ('info', 'warning', 'critical');
  end if;
end $$;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name varchar(255) not null,
  code varchar(50),
  type public.location_type not null default 'branch',
  address text,
  phone varchar(50),
  manager_user_id uuid references public.company_users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.company_users(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, location_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name varchar(255) not null,
  barcode varchar(100),
  category_id uuid references public.categories(id) on delete set null,
  category_name varchar(150) not null default 'General',
  unit_name varchar(50) not null default 'unit',
  reorder_point integer not null default 0 check (reorder_point >= 0),
  default_expiry_notification_days integer check (default_expiry_notification_days is null or default_expiry_notification_days >= 0),
  default_supplier_id uuid references public.suppliers(id) on delete set null,
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_company_barcode_unique
  on public.products(company_id, barcode)
  where barcode is not null and barcode <> '';

create table if not exists public.stock_lots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  lot_number varchar(100),
  received_at timestamptz not null default now(),
  manufactured_at timestamptz,
  expiry_date timestamptz,
  expiry_notification_days integer check (expiry_notification_days is null or expiry_notification_days >= 0),
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  status public.stock_lot_status not null default 'available',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stock_lots_company_location_idx
  on public.stock_lots(company_id, location_id, status);
create index if not exists stock_lots_expiry_idx
  on public.stock_lots(company_id, expiry_date)
  where expiry_date is not null and quantity_on_hand > 0;

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  stock_lot_id uuid not null references public.stock_lots(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  movement_type public.stock_movement_type not null,
  quantity_delta integer not null,
  reference_type varchar(50),
  reference_id uuid,
  reason text,
  created_by_auth_user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_lot_idx
  on public.stock_movements(company_id, stock_lot_id, created_at desc);

create table if not exists public.stock_count_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete restrict,
  status public.stock_count_status not null default 'open',
  started_by_company_user_id uuid references public.company_users(id) on delete set null,
  reviewed_by_company_user_id uuid references public.company_users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz
);

create table if not exists public.stock_count_lines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.stock_count_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  stock_lot_id uuid references public.stock_lots(id) on delete restrict,
  expected_quantity integer not null default 0,
  counted_quantity integer check (counted_quantity is null or counted_quantity >= 0),
  status public.stock_count_line_status not null default 'pending',
  variance_reason text,
  counted_by_auth_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_location_id uuid not null references public.locations(id) on delete restrict,
  destination_location_id uuid not null references public.locations(id) on delete restrict,
  status public.inventory_transfer_status not null default 'requested',
  requested_by_company_user_id uuid references public.company_users(id) on delete set null,
  reviewed_by_company_user_id uuid references public.company_users(id) on delete set null,
  received_by_company_user_id uuid references public.company_users(id) on delete set null,
  note text,
  decision_note text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_location_id <> destination_location_id)
);

create table if not exists public.stock_transfer_lines (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.stock_transfers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  source_lot_id uuid references public.stock_lots(id) on delete restrict,
  quantity_requested integer not null check (quantity_requested > 0),
  quantity_approved integer check (quantity_approved is null or quantity_approved > 0),
  quantity_received integer not null default 0 check (quantity_received >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.supplier_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete restrict,
  supplier_id uuid references public.suppliers(id) on delete set null,
  product_id uuid not null references public.products(id) on delete restrict,
  request_type public.supplier_request_type not null default 'replenish',
  status public.supplier_request_status not null default 'open',
  quantity_requested integer check (quantity_requested is null or quantity_requested > 0),
  reason text,
  notes text,
  created_by_company_user_id uuid references public.company_users(id) on delete set null,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recipient_company_user_id uuid not null references public.company_users(id) on delete cascade,
  notification_type public.notification_type not null,
  severity public.notification_severity not null default 'info',
  title varchar(255) not null,
  message text,
  reference_type varchar(50),
  reference_id uuid,
  is_read boolean not null default false,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.stock_count_sessions add column if not exists updated_at timestamptz not null default now();
alter table public.stock_count_lines add column if not exists updated_at timestamptz not null default now();

-- Backfill the new model without deleting the legacy MVP tables.
insert into public.locations (company_id, name, code, type, address, phone, is_active)
select b.company_id, b.name, b.code, 'branch'::public.location_type, b.address, b.phone, b.is_active
from public.branches b
where not exists (
  select 1 from public.locations l
  where l.company_id = b.company_id and coalesce(l.code, '') = coalesce(b.code, '') and l.name = b.name
);

insert into public.user_locations (user_id, location_id)
select ub.user_id, l.id
from public.user_branches ub
join public.company_users cu on cu.id = ub.user_id
join public.branches b on b.id = ub.branch_id
join public.locations l
  on l.company_id = b.company_id
 and l.name = b.name
 and coalesce(l.code, '') = coalesce(b.code, '')
on conflict (user_id, location_id) do nothing;

insert into public.products (company_id, name, barcode, category_id, category_name, unit_name, unit_cost, is_active)
select i.company_id,
       i.name,
       nullif(i.barcode, ''),
       (array_agg(i.category_id) filter (where i.category_id is not null))[1],
       max(i.category_name),
       'unit',
       max(i.balance / greatest(i.quantity, 1)),
       true
from public.items i
group by i.company_id, i.name, nullif(i.barcode, '')
on conflict do nothing;

insert into public.stock_lots (
  company_id, product_id, location_id, lot_number, received_at, expiry_date,
  expiry_notification_days, quantity_on_hand, unit_cost, status, notes
)
select i.company_id,
       p.id,
       l.id,
       'legacy-' || left(i.id::text, 8),
       i.created_at,
       i.expiry_date,
       i.expiry_notification_days,
       greatest(i.quantity, 0),
       case when i.quantity > 0 then greatest(i.balance / i.quantity, 0) else 0 end,
       case when i.quantity > 0 then 'available'::public.stock_lot_status else 'depleted'::public.stock_lot_status end,
       'Imported from the MVP items table.'
from public.items i
join public.products p
  on p.company_id = i.company_id
 and p.name = i.name
 and coalesce(p.barcode, '') = coalesce(nullif(i.barcode, ''), '')
join public.branches b on b.id = i.branch_id
join public.locations l
  on l.company_id = b.company_id
 and l.name = b.name
 and coalesce(l.code, '') = coalesce(b.code, '')
where not exists (
  select 1 from public.stock_lots sl where sl.lot_number = 'legacy-' || left(i.id::text, 8)
);

insert into public.stock_movements (
  company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reason
)
select sl.company_id, sl.product_id, sl.id, sl.location_id, 'opening_balance', sl.quantity_on_hand,
       'Imported from the MVP items table.'
from public.stock_lots sl
where sl.lot_number like 'legacy-%'
  and not exists (
    select 1 from public.stock_movements sm
    where sm.stock_lot_id = sl.id and sm.movement_type = 'opening_balance'
  );

create or replace function public.can_access_location(target_location_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.locations l
    where l.id = target_location_id
      and l.company_id = public.get_auth_company_id()
      and (
        public.is_company_admin()
        or l.manager_user_id in (
          select cu.id from public.company_users cu
           where cu.auth_user_id = auth.uid()
             and cu.status = 'active'
             and cu.company_id = l.company_id
        )
        or exists (
          select 1
          from public.user_locations ul
          join public.company_users cu on cu.id = ul.user_id
          where ul.location_id = l.id
            and cu.auth_user_id = auth.uid()
        )
      )
  );
$$;

revoke all on function public.can_access_location(uuid) from public;
grant execute on function public.can_access_location(uuid) to authenticated;

alter table public.locations enable row level security;
alter table public.user_locations enable row level security;
alter table public.products enable row level security;
alter table public.stock_lots enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_count_sessions enable row level security;
alter table public.stock_count_lines enable row level security;
alter table public.stock_transfers enable row level security;
alter table public.stock_transfer_lines enable row level security;
alter table public.supplier_requests enable row level security;
alter table public.notifications enable row level security;

drop policy if exists redesign_locations_select on public.locations;
create policy redesign_locations_select on public.locations for select to authenticated
using (company_id = public.get_auth_company_id() and (public.is_company_admin() or public.can_access_location(id)));

drop policy if exists redesign_locations_write on public.locations;
create policy redesign_locations_write on public.locations for all to authenticated
using (company_id = public.get_auth_company_id() and public.is_company_admin())
with check (company_id = public.get_auth_company_id() and public.is_company_admin());

drop policy if exists redesign_user_locations_select on public.user_locations;
create policy redesign_user_locations_select on public.user_locations for select to authenticated
using (
  exists (
    select 1 from public.company_users cu
    where cu.id = user_locations.user_id
      and cu.company_id = public.get_auth_company_id()
      and (cu.auth_user_id = auth.uid() or public.is_company_admin())
  )
);

drop policy if exists redesign_user_locations_write on public.user_locations;
create policy redesign_user_locations_write on public.user_locations for all to authenticated
using (public.is_company_admin())
with check (public.is_company_admin());

drop policy if exists redesign_products_select on public.products;
create policy redesign_products_select on public.products for select to authenticated
using (company_id = public.get_auth_company_id());

drop policy if exists redesign_products_write on public.products;
create policy redesign_products_write on public.products for all to authenticated
using (company_id = public.get_auth_company_id() and public.is_company_admin())
with check (company_id = public.get_auth_company_id() and public.is_company_admin());

drop policy if exists redesign_stock_lots_select on public.stock_lots;
create policy redesign_stock_lots_select on public.stock_lots for select to authenticated
using (company_id = public.get_auth_company_id() and public.can_access_location(location_id));

drop policy if exists redesign_stock_lots_write on public.stock_lots;
create policy redesign_stock_lots_write on public.stock_lots for all to authenticated
using (company_id = public.get_auth_company_id() and (public.is_company_admin() or public.can_access_location(location_id)))
with check (company_id = public.get_auth_company_id() and (public.is_company_admin() or public.can_access_location(location_id)));

drop policy if exists redesign_stock_movements_select on public.stock_movements;
create policy redesign_stock_movements_select on public.stock_movements for select to authenticated
using (company_id = public.get_auth_company_id() and public.can_access_location(location_id));

drop policy if exists redesign_stock_counts_select on public.stock_count_sessions;
create policy redesign_stock_counts_select on public.stock_count_sessions for select to authenticated
using (company_id = public.get_auth_company_id() and public.can_access_location(location_id));

drop policy if exists redesign_stock_count_lines_select on public.stock_count_lines;
create policy redesign_stock_count_lines_select on public.stock_count_lines for select to authenticated
using (exists (select 1 from public.stock_count_sessions s where s.id = session_id and s.company_id = public.get_auth_company_id() and public.can_access_location(s.location_id)));

drop policy if exists redesign_transfers_select on public.stock_transfers;
create policy redesign_transfers_select on public.stock_transfers for select to authenticated
using (company_id = public.get_auth_company_id() and (public.is_company_admin() or public.can_access_location(source_location_id) or public.can_access_location(destination_location_id)));

drop policy if exists redesign_transfer_lines_select on public.stock_transfer_lines;
create policy redesign_transfer_lines_select on public.stock_transfer_lines for select to authenticated
using (exists (select 1 from public.stock_transfers t where t.id = transfer_id and t.company_id = public.get_auth_company_id()));

drop policy if exists redesign_supplier_requests_select on public.supplier_requests;
create policy redesign_supplier_requests_select on public.supplier_requests for select to authenticated
using (company_id = public.get_auth_company_id() and (public.is_company_admin() or public.can_access_location(location_id)));

drop policy if exists redesign_notifications_select on public.notifications;
create policy redesign_notifications_select on public.notifications for select to authenticated
using (
  company_id = public.get_auth_company_id()
  and exists (
    select 1 from public.company_users cu
    where cu.id = recipient_company_user_id and cu.auth_user_id = auth.uid()
  )
);

create or replace function public.receive_stock(
  p_product_id uuid,
  p_location_id uuid,
  p_quantity integer,
  p_lot_number text default null,
  p_expiry_date timestamptz default null,
  p_expiry_notification_days integer default null,
  p_supplier_id uuid default null,
  p_unit_cost numeric default 0,
  p_notes text default null
)
returns public.stock_lots
language plpgsql
security definer
set search_path = public
as $$
declare
  company_id_value uuid;
  lot_row public.stock_lots;
begin
  company_id_value := public.get_auth_company_id();
  if company_id_value is null or not public.can_access_location(p_location_id) then
    raise exception 'You do not have access to this location';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Received quantity must be greater than zero';
  end if;
  if not exists (select 1 from public.products where id = p_product_id and company_id = company_id_value) then
    raise exception 'Product does not belong to your company';
  end if;

  insert into public.stock_lots (
    company_id, product_id, location_id, supplier_id, lot_number, expiry_date,
    expiry_notification_days, quantity_on_hand, unit_cost, notes
  ) values (
    company_id_value, p_product_id, p_location_id, p_supplier_id, nullif(trim(p_lot_number), ''),
    p_expiry_date, p_expiry_notification_days, p_quantity, greatest(coalesce(p_unit_cost, 0), 0), p_notes
  ) returning * into lot_row;

  insert into public.stock_movements (
    company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta,
    reference_type, reference_id, created_by_auth_user_id
  ) values (
    company_id_value, p_product_id, lot_row.id, p_location_id, 'receive', p_quantity,
    'stock_lot', lot_row.id, auth.uid()
  );

  return lot_row;
end;
$$;

revoke all on function public.receive_stock(uuid, uuid, integer, text, timestamptz, integer, uuid, numeric, text) from public;
grant execute on function public.receive_stock(uuid, uuid, integer, text, timestamptz, integer, uuid, numeric, text) to authenticated;

-- Task commands. These are the only supported paths for changing stock after
-- the redesign. The UI submits an action; the database writes the movement,
-- lot, request, or review records inside one transaction.
create or replace function public.start_stock_count(p_location_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  company_id_value uuid;
  company_user_id_value uuid;
  session_id_value uuid;
begin
  company_id_value := public.get_auth_company_id();
  select id into company_user_id_value from public.company_users where company_id = company_id_value and auth_user_id = auth.uid() limit 1;
  if company_id_value is null or not public.can_access_location(p_location_id) then raise exception 'You do not have access to this location'; end if;
  insert into public.stock_count_sessions (company_id, location_id, started_by_company_user_id)
  values (company_id_value, p_location_id, company_user_id_value)
  returning id into session_id_value;
  return session_id_value;
end;
$$;
revoke all on function public.start_stock_count(uuid) from public;
grant execute on function public.start_stock_count(uuid) to authenticated;

create or replace function public.submit_stock_count(p_session_id uuid, p_lines jsonb)
returns public.stock_count_sessions
language plpgsql security definer set search_path = public
as $$
declare
  session_row public.stock_count_sessions;
  line jsonb;
  product_id_value uuid;
  counted_value integer;
  expected_value integer;
begin
  select * into session_row from public.stock_count_sessions where id = p_session_id and company_id = public.get_auth_company_id() for update;
  if session_row.id is null or not public.can_access_location(session_row.location_id) then raise exception 'Count session not found'; end if;
  if session_row.status <> 'open' then raise exception 'This count is already submitted'; end if;
  for line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    product_id_value := (line->>'product_id')::uuid;
    counted_value := (line->>'counted_quantity')::integer;
    if counted_value is null or counted_value < 0 then raise exception 'Counted quantity must be zero or greater'; end if;
    select coalesce(sum(quantity_on_hand), 0) into expected_value
    from public.stock_lots where company_id = session_row.company_id and location_id = session_row.location_id and product_id = product_id_value and quantity_on_hand > 0;
    insert into public.stock_count_lines (session_id, product_id, expected_quantity, counted_quantity, status, counted_by_auth_user_id)
    values (session_row.id, product_id_value, expected_value, counted_value, case when expected_value = counted_value then 'matched'::public.stock_count_line_status else 'variance'::public.stock_count_line_status end, auth.uid());
  end loop;
  update public.stock_count_sessions set status = 'submitted', submitted_at = now(), updated_at = now() where id = session_row.id returning * into session_row;
  return session_row;
end;
$$;
revoke all on function public.submit_stock_count(uuid, jsonb) from public;
grant execute on function public.submit_stock_count(uuid, jsonb) to authenticated;

create or replace function public.review_stock_count(p_session_id uuid, p_approve boolean, p_note text default null)
returns public.stock_count_sessions
language plpgsql security definer set search_path = public
as $$
declare
  session_row public.stock_count_sessions;
  company_user_id_value uuid;
  line_row record;
  lot_row public.stock_lots;
  delta_value integer;
  remaining_value integer;
  take_value integer;
begin
  select * into session_row from public.stock_count_sessions where id = p_session_id and company_id = public.get_auth_company_id() for update;
  if session_row.id is null or not public.is_company_admin() and not public.can_access_location(session_row.location_id) then raise exception 'Count session not found'; end if;
  if session_row.status <> 'submitted' then raise exception 'Only submitted counts can be reviewed'; end if;
  select id into company_user_id_value from public.company_users where company_id = session_row.company_id and auth_user_id = auth.uid() limit 1;
  if not p_approve then
    update public.stock_count_sessions set status = 'rejected', notes = p_note, reviewed_by_company_user_id = company_user_id_value, reviewed_at = now(), updated_at = now() where id = session_row.id returning * into session_row;
    return session_row;
  end if;
  for line_row in select * from public.stock_count_lines where session_id = session_row.id for update loop
    delta_value := coalesce(line_row.counted_quantity, 0) - line_row.expected_quantity;
    if delta_value > 0 then
      select * into lot_row from public.stock_lots where company_id = session_row.company_id and location_id = session_row.location_id and product_id = line_row.product_id and status = 'available' order by expiry_date nulls last, received_at for update limit 1;
      if lot_row.id is null then raise exception 'Cannot add counted stock for a product with no available lot'; end if;
      update public.stock_lots set quantity_on_hand = quantity_on_hand + delta_value, updated_at = now() where id = lot_row.id;
      insert into public.stock_movements (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by_auth_user_id) values (session_row.company_id, line_row.product_id, lot_row.id, session_row.location_id, 'count_adjustment', delta_value, 'count_session', session_row.id, 'Approved stock count adjustment', auth.uid());
    elsif delta_value < 0 then
      remaining_value := abs(delta_value);
      for lot_row in select * from public.stock_lots where company_id = session_row.company_id and location_id = session_row.location_id and product_id = line_row.product_id and quantity_on_hand > 0 order by expiry_date nulls first, received_at for update loop
        exit when remaining_value <= 0;
        take_value := least(remaining_value, lot_row.quantity_on_hand);
        update public.stock_lots set quantity_on_hand = quantity_on_hand - take_value, status = case when quantity_on_hand - take_value = 0 then 'depleted'::public.stock_lot_status else status end, updated_at = now() where id = lot_row.id;
        insert into public.stock_movements (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by_auth_user_id) values (session_row.company_id, line_row.product_id, lot_row.id, session_row.location_id, 'count_adjustment', -take_value, 'count_session', session_row.id, 'Approved stock count adjustment', auth.uid());
        remaining_value := remaining_value - take_value;
      end loop;
    end if;
    update public.stock_count_lines set status = 'approved', updated_at = now() where id = line_row.id;
  end loop;
  update public.stock_count_sessions set status = 'approved', notes = p_note, reviewed_by_company_user_id = company_user_id_value, reviewed_at = now(), updated_at = now() where id = session_row.id returning * into session_row;
  return session_row;
end;
$$;
revoke all on function public.review_stock_count(uuid, boolean, text) from public;
grant execute on function public.review_stock_count(uuid, boolean, text) to authenticated;

create or replace function public.resolve_expiry_action(p_lot_id uuid, p_action text, p_reason text default null)
returns public.stock_lots
language plpgsql security definer set search_path = public
as $$
declare
  lot_row public.stock_lots;
  company_user_id_value uuid;
  request_type_value public.supplier_request_type;
  movement_type_value public.stock_movement_type;
  old_quantity integer;
begin
  select * into lot_row from public.stock_lots where id = p_lot_id and company_id = public.get_auth_company_id() for update;
  if lot_row.id is null or not public.can_access_location(lot_row.location_id) then raise exception 'Stock lot not found'; end if;
  select id into company_user_id_value from public.company_users where company_id = lot_row.company_id and auth_user_id = auth.uid() limit 1;
  if p_action = 'hold' then update public.stock_lots set status = 'on_hold', notes = coalesce(p_reason, notes), updated_at = now() where id = lot_row.id returning * into lot_row; return lot_row; end if;
  if p_action = 'dispose' then
    old_quantity := lot_row.quantity_on_hand;
    update public.stock_lots set quantity_on_hand = 0, status = 'disposed', notes = coalesce(p_reason, notes), updated_at = now() where id = lot_row.id returning * into lot_row;
    if old_quantity > 0 then insert into public.stock_movements (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reason, created_by_auth_user_id) values (lot_row.company_id, lot_row.product_id, lot_row.id, lot_row.location_id, 'disposal', -old_quantity, coalesce(p_reason, 'Expired stock removed'), auth.uid()); end if;
    return lot_row;
  end if;
  if p_action = 'return' then request_type_value := 'return'; elsif p_action = 'replace' then request_type_value := 'replace'; else raise exception 'Unsupported expiry action'; end if;
  update public.stock_lots set status = 'on_hold', notes = coalesce(p_reason, notes), updated_at = now() where id = lot_row.id returning * into lot_row;
  insert into public.supplier_requests (company_id, location_id, supplier_id, product_id, request_type, quantity_requested, reason, created_by_company_user_id)
  values (lot_row.company_id, lot_row.location_id, lot_row.supplier_id, lot_row.product_id, request_type_value, lot_row.quantity_on_hand, coalesce(p_reason, 'Created from expiry queue'), company_user_id_value);
  return lot_row;
end;
$$;
revoke all on function public.resolve_expiry_action(uuid, text, text) from public;
grant execute on function public.resolve_expiry_action(uuid, text, text) to authenticated;

create or replace function public.create_supplier_request(p_location_id uuid, p_product_id uuid, p_request_type public.supplier_request_type, p_quantity integer default null, p_supplier_id uuid default null, p_reason text default null)
returns public.supplier_requests
language plpgsql security definer set search_path = public
as $$
declare result_row public.supplier_requests; company_id_value uuid; company_user_id_value uuid;
begin
  company_id_value := public.get_auth_company_id();
  if company_id_value is null or not public.can_access_location(p_location_id) then raise exception 'You do not have access to this location'; end if;
  if not exists (select 1 from public.products where id = p_product_id and company_id = company_id_value) then raise exception 'Product not found'; end if;
  select id into company_user_id_value from public.company_users where company_id = company_id_value and auth_user_id = auth.uid() limit 1;
  insert into public.supplier_requests (company_id, location_id, supplier_id, product_id, request_type, quantity_requested, reason, created_by_company_user_id)
  values (company_id_value, p_location_id, p_supplier_id, p_product_id, p_request_type, p_quantity, p_reason, company_user_id_value) returning * into result_row;
  return result_row;
end;
$$;
revoke all on function public.create_supplier_request(uuid, uuid, public.supplier_request_type, integer, uuid, text) from public;
grant execute on function public.create_supplier_request(uuid, uuid, public.supplier_request_type, integer, uuid, text) to authenticated;

-- Define the role helper before the supplier-product policy below. It is
-- repeated later with the same body alongside the command-function helpers
-- so this migration also works on a clean database, not only on an already
-- partially-applied development database.
create or replace function public.is_company_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.company_users cu
     where cu.company_id = public.get_auth_company_id()
       and cu.auth_user_id = auth.uid()
       and cu.status = 'active'
       and cu.role in ('owner', 'admin', 'manager')
  );
$$;
revoke all on function public.is_company_manager() from public;
grant execute on function public.is_company_manager() to authenticated;

create table if not exists public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  supplier_sku varchar(100),
  unit_cost numeric(14, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, supplier_id, product_id)
);
alter table public.supplier_products enable row level security;
drop policy if exists redesign_supplier_products_select on public.supplier_products;
create policy redesign_supplier_products_select on public.supplier_products for select to authenticated
using (company_id = public.get_auth_company_id());
drop policy if exists redesign_supplier_products_write on public.supplier_products;
create policy redesign_supplier_products_write on public.supplier_products for all to authenticated
using (company_id = public.get_auth_company_id() and public.is_company_manager())
with check (company_id = public.get_auth_company_id() and public.is_company_manager());

create or replace function public.submit_stock_count(p_session_id uuid, p_lines jsonb)
returns public.stock_count_sessions
language plpgsql security definer set search_path = public
as $$
declare
  session_row public.stock_count_sessions;
  line jsonb;
  product_id_value uuid;
  counted_value integer;
  expected_value integer;
  reason_value text;
  line_count integer := 0;
begin
  select * into session_row from public.stock_count_sessions where id = p_session_id and company_id = public.get_auth_company_id() for update;
  if session_row.id is null or not public.can_access_location(session_row.location_id) then raise exception 'Count session not found'; end if;
  if session_row.status <> 'open' then raise exception 'This count is already submitted'; end if;
  for line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    line_count := line_count + 1;
    product_id_value := (line->>'product_id')::uuid;
    counted_value := (line->>'counted_quantity')::integer;
    reason_value := nullif(trim(line->>'variance_reason'), '');
    if not exists (select 1 from public.products where id = product_id_value and company_id = session_row.company_id and is_active) then raise exception 'Count line contains a product outside this company'; end if;
    if counted_value is null or counted_value < 0 then raise exception 'Counted quantity must be zero or greater'; end if;
    select coalesce(sum(quantity_on_hand), 0) into expected_value from public.stock_lots where company_id = session_row.company_id and location_id = session_row.location_id and product_id = product_id_value and quantity_on_hand > 0;
    if counted_value <> expected_value and reason_value is null then raise exception 'Add a reason for every count difference'; end if;
    insert into public.stock_count_lines (session_id, product_id, expected_quantity, counted_quantity, variance_reason, status, counted_by_auth_user_id)
    values (session_row.id, product_id_value, expected_value, counted_value, reason_value, case when expected_value = counted_value then 'matched'::public.stock_count_line_status else 'variance'::public.stock_count_line_status end, auth.uid());
  end loop;
  if line_count = 0 then raise exception 'Add at least one product to the count'; end if;
  update public.stock_count_sessions set status = 'submitted', submitted_at = now(), updated_at = now() where id = session_row.id returning * into session_row;
  return session_row;
end;
$$;
revoke all on function public.submit_stock_count(uuid, jsonb) from public;
grant execute on function public.submit_stock_count(uuid, jsonb) to authenticated;

create or replace function public.update_supplier_request_status(p_request_id uuid, p_status public.supplier_request_status)
returns public.supplier_requests
language plpgsql security definer set search_path = public
as $$
declare result_row public.supplier_requests;
begin
  update public.supplier_requests set status = p_status, last_contacted_at = case when p_status = 'contacted' then now() else last_contacted_at end, updated_at = now()
  where id = p_request_id and company_id = public.get_auth_company_id() and (public.is_company_admin() or public.can_access_location(location_id)) returning * into result_row;
  if result_row.id is null then raise exception 'Supplier request not found'; end if;
  return result_row;
end;
$$;
revoke all on function public.update_supplier_request_status(uuid, public.supplier_request_status) from public;
grant execute on function public.update_supplier_request_status(uuid, public.supplier_request_status) to authenticated;

create or replace function public.create_stock_transfer(p_source_location_id uuid, p_destination_location_id uuid, p_product_id uuid, p_quantity integer, p_note text default null)
returns public.stock_transfers
language plpgsql security definer set search_path = public
as $$
declare result_row public.stock_transfers; company_id_value uuid; company_user_id_value uuid;
begin
  company_id_value := public.get_auth_company_id();
  if p_source_location_id = p_destination_location_id or p_quantity is null or p_quantity <= 0 then raise exception 'Choose two locations and a positive quantity'; end if;
  if company_id_value is null or not public.can_access_location(p_destination_location_id) then raise exception 'You do not have access to the destination location'; end if;
  if not exists (select 1 from public.locations where id = p_source_location_id and company_id = company_id_value) then raise exception 'Source location not found'; end if;
  if not exists (select 1 from public.products where id = p_product_id and company_id = company_id_value) then raise exception 'Product not found'; end if;
  select id into company_user_id_value from public.company_users where company_id = company_id_value and auth_user_id = auth.uid() limit 1;
  insert into public.stock_transfers (company_id, source_location_id, destination_location_id, requested_by_company_user_id, note) values (company_id_value, p_source_location_id, p_destination_location_id, company_user_id_value, p_note) returning * into result_row;
  insert into public.stock_transfer_lines (transfer_id, product_id, quantity_requested) values (result_row.id, p_product_id, p_quantity);
  return result_row;
end;
$$;
revoke all on function public.create_stock_transfer(uuid, uuid, uuid, integer, text) from public;
grant execute on function public.create_stock_transfer(uuid, uuid, uuid, integer, text) to authenticated;

create or replace function public.create_stock_transfer_multi(p_source_location_id uuid, p_destination_location_id uuid, p_lines jsonb, p_note text default null)
returns public.stock_transfers
language plpgsql security definer set search_path = public
as $$
declare result_row public.stock_transfers; company_id_value uuid; company_user_id_value uuid; line jsonb; product_id_value uuid; quantity_value integer;
begin
  company_id_value := public.get_auth_company_id();
  if p_source_location_id = p_destination_location_id or jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) = 0 then raise exception 'Choose two locations and at least one product'; end if;
  if exists (select 1 from jsonb_array_elements(p_lines) as duplicate_line group by duplicate_line->>'product_id' having count(*) > 1) then raise exception 'Add each product only once to a transfer'; end if;
  if company_id_value is null or not public.can_access_location(p_destination_location_id) then raise exception 'You do not have access to the destination location'; end if;
  if not exists (select 1 from public.locations where id = p_source_location_id and company_id = company_id_value) then raise exception 'Source location not found'; end if;
  select id into company_user_id_value from public.company_users where company_id = company_id_value and auth_user_id = auth.uid() limit 1;
  insert into public.stock_transfers (company_id, source_location_id, destination_location_id, requested_by_company_user_id, note) values (company_id_value, p_source_location_id, p_destination_location_id, company_user_id_value, p_note) returning * into result_row;
  for line in select * from jsonb_array_elements(p_lines) loop
    product_id_value := (line->>'product_id')::uuid; quantity_value := (line->>'quantity')::integer;
    if quantity_value is null or quantity_value <= 0 or not exists (select 1 from public.products where id = product_id_value and company_id = company_id_value) then raise exception 'Each transfer line needs a valid product and positive quantity'; end if;
    insert into public.stock_transfer_lines (transfer_id, product_id, quantity_requested) values (result_row.id, product_id_value, quantity_value);
  end loop;
  return result_row;
end;
$$;
revoke all on function public.create_stock_transfer_multi(uuid, uuid, jsonb, text) from public;
grant execute on function public.create_stock_transfer_multi(uuid, uuid, jsonb, text) to authenticated;

create or replace function public.approve_stock_transfer(p_transfer_id uuid, p_approve boolean, p_note text default null)
returns public.stock_transfers
language plpgsql security definer set search_path = public
as $$
declare transfer_row public.stock_transfers; line_row record; lot_row public.stock_lots; company_user_id_value uuid; approved_value integer;
begin
  select * into transfer_row from public.stock_transfers where id = p_transfer_id and company_id = public.get_auth_company_id() for update;
  if transfer_row.id is null or not public.can_access_location(transfer_row.source_location_id) then raise exception 'Transfer not found'; end if;
  select id into company_user_id_value from public.company_users where company_id = transfer_row.company_id and auth_user_id = auth.uid() limit 1;
  if not p_approve then update public.stock_transfers set status = 'rejected', decision_note = p_note, reviewed_by_company_user_id = company_user_id_value, updated_at = now() where id = transfer_row.id returning * into transfer_row; return transfer_row; end if;
  for line_row in select * from public.stock_transfer_lines where transfer_id = transfer_row.id for update loop
    select * into lot_row from public.stock_lots where company_id = transfer_row.company_id and location_id = transfer_row.source_location_id and product_id = line_row.product_id and quantity_on_hand > 0 and status = 'available' order by expiry_date nulls last, received_at for update limit 1;
    approved_value := least(line_row.quantity_requested, coalesce(lot_row.quantity_on_hand, 0));
    if approved_value <= 0 then raise exception 'There is not enough available stock to approve this transfer'; end if;
    update public.stock_transfer_lines set source_lot_id = lot_row.id, quantity_approved = approved_value where id = line_row.id;
  end loop;
  update public.stock_transfers set status = 'in_transit', decision_note = p_note, reviewed_by_company_user_id = company_user_id_value, approved_at = now(), updated_at = now() where id = transfer_row.id returning * into transfer_row;
  return transfer_row;
end;
$$;
revoke all on function public.approve_stock_transfer(uuid, boolean, text) from public;
grant execute on function public.approve_stock_transfer(uuid, boolean, text) to authenticated;

create or replace function public.resolve_expiry_action(p_lot_id uuid, p_action text, p_reason text default null)
returns public.stock_lots
language plpgsql security definer set search_path = public
as $$
declare
  lot_row public.stock_lots;
  company_user_id_value uuid;
  request_type_value public.supplier_request_type;
  old_quantity integer;
begin
  select * into lot_row from public.stock_lots where id = p_lot_id and company_id = public.get_auth_company_id() for update;
  if lot_row.id is null or not public.can_manage_location(lot_row.location_id) then raise exception 'Stock lot not found'; end if;
  select id into company_user_id_value from public.company_users where company_id = lot_row.company_id and auth_user_id = auth.uid() limit 1;
  if p_action = 'hold' then
    update public.stock_lots set status = 'on_hold', notes = coalesce(p_reason, notes), updated_at = now() where id = lot_row.id returning * into lot_row;
    return lot_row;
  end if;
  if p_action = 'dispose' then
    old_quantity := lot_row.quantity_on_hand;
    update public.stock_lots set quantity_on_hand = 0, status = 'disposed', notes = coalesce(p_reason, notes), updated_at = now() where id = lot_row.id returning * into lot_row;
    if old_quantity > 0 then
      insert into public.stock_movements (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reason, created_by_auth_user_id)
      values (lot_row.company_id, lot_row.product_id, lot_row.id, lot_row.location_id, 'disposal', -old_quantity, coalesce(p_reason, 'Expired stock removed'), auth.uid());
    end if;
    return lot_row;
  end if;
  if p_action = 'return' then request_type_value := 'return'; elsif p_action = 'replace' then request_type_value := 'replace'; else raise exception 'Unsupported expiry action'; end if;
  update public.stock_lots set status = 'on_hold', notes = coalesce(p_reason, notes), updated_at = now() where id = lot_row.id returning * into lot_row;
  insert into public.supplier_requests (company_id, location_id, supplier_id, product_id, request_type, quantity_requested, reason, created_by_company_user_id)
  values (lot_row.company_id, lot_row.location_id, lot_row.supplier_id, lot_row.product_id, request_type_value, lot_row.quantity_on_hand, coalesce(p_reason, 'Created from expiry queue'), company_user_id_value);
  return lot_row;
end;
$$;
revoke all on function public.resolve_expiry_action(uuid, text, text) from public;
grant execute on function public.resolve_expiry_action(uuid, text, text) to authenticated;

create or replace function public.create_supplier_request(p_location_id uuid, p_product_id uuid, p_request_type public.supplier_request_type, p_quantity integer default null, p_supplier_id uuid default null, p_reason text default null)
returns public.supplier_requests
language plpgsql security definer set search_path = public
as $$
declare result_row public.supplier_requests; company_id_value uuid; company_user_id_value uuid;
begin
  company_id_value := public.get_auth_company_id();
  if company_id_value is null or not public.can_access_location(p_location_id) then raise exception 'You do not have access to this location'; end if;
  if not exists (select 1 from public.products where id = p_product_id and company_id = company_id_value and is_active) then raise exception 'Product not found'; end if;
  if p_supplier_id is not null and not exists (select 1 from public.suppliers where id = p_supplier_id and company_id = company_id_value) then raise exception 'Supplier not found'; end if;
  if p_quantity is not null and p_quantity <= 0 then raise exception 'Requested quantity must be greater than zero'; end if;
  select id into company_user_id_value from public.company_users where company_id = company_id_value and auth_user_id = auth.uid() limit 1;
  insert into public.supplier_requests (company_id, location_id, supplier_id, product_id, request_type, quantity_requested, reason, created_by_company_user_id)
  values (company_id_value, p_location_id, p_supplier_id, p_product_id, p_request_type, p_quantity, p_reason, company_user_id_value) returning * into result_row;
  return result_row;
end;
$$;
revoke all on function public.create_supplier_request(uuid, uuid, public.supplier_request_type, integer, uuid, text) from public;
grant execute on function public.create_supplier_request(uuid, uuid, public.supplier_request_type, integer, uuid, text) to authenticated;

drop function if exists public.receive_stock_transfer(uuid);
create function public.receive_stock_transfer(p_transfer_id uuid)
returns public.stock_transfers
language plpgsql security definer set search_path = public
as $$
declare transfer_row public.stock_transfers; line_row record; source_lot public.stock_lots; destination_lot public.stock_lots; company_user_id_value uuid;
begin
  select * into transfer_row from public.stock_transfers where id = p_transfer_id and company_id = public.get_auth_company_id() for update;
  if transfer_row.id is null or not public.can_access_location(transfer_row.destination_location_id) then raise exception 'Transfer not found'; end if;
  if transfer_row.status not in ('approved', 'in_transit', 'partially_received') then raise exception 'This transfer cannot be received'; end if;
  select id into company_user_id_value from public.company_users where company_id = transfer_row.company_id and auth_user_id = auth.uid() limit 1;
  for line_row in select * from public.stock_transfer_lines where transfer_id = transfer_row.id for update loop
    select * into source_lot from public.stock_lots where id = line_row.source_lot_id for update;
    if source_lot.id is null or source_lot.quantity_on_hand < coalesce(line_row.quantity_approved, line_row.quantity_requested) then raise exception 'Source stock is no longer available'; end if;
    update public.stock_lots set quantity_on_hand = quantity_on_hand - coalesce(line_row.quantity_approved, line_row.quantity_requested), status = case when quantity_on_hand - coalesce(line_row.quantity_approved, line_row.quantity_requested) = 0 then 'depleted'::public.stock_lot_status else status end, updated_at = now() where id = source_lot.id;
    insert into public.stock_movements (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by_auth_user_id) values (transfer_row.company_id, source_lot.product_id, source_lot.id, source_lot.location_id, 'transfer_out', -coalesce(line_row.quantity_approved, line_row.quantity_requested), 'stock_transfer', transfer_row.id, 'Transfer sent', auth.uid());
    insert into public.stock_lots (company_id, product_id, location_id, supplier_id, lot_number, received_at, manufactured_at, expiry_date, expiry_notification_days, quantity_on_hand, unit_cost, status, notes) values (source_lot.company_id, source_lot.product_id, transfer_row.destination_location_id, source_lot.supplier_id, source_lot.lot_number, now(), source_lot.manufactured_at, source_lot.expiry_date, source_lot.expiry_notification_days, coalesce(line_row.quantity_approved, line_row.quantity_requested), source_lot.unit_cost, 'available', 'Received from stock transfer ' || left(transfer_row.id::text, 8)) returning * into destination_lot;
    insert into public.stock_movements (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by_auth_user_id) values (transfer_row.company_id, destination_lot.product_id, destination_lot.id, destination_lot.location_id, 'transfer_in', destination_lot.quantity_on_hand, 'stock_transfer', transfer_row.id, 'Transfer received', auth.uid());
    update public.stock_transfer_lines set quantity_received = coalesce(line_row.quantity_approved, line_row.quantity_requested) where id = line_row.id;
  end loop;
  update public.stock_transfers set status = 'received', received_by_company_user_id = company_user_id_value, received_at = now(), updated_at = now() where id = transfer_row.id returning * into transfer_row;
  return transfer_row;
end;
$$;
revoke all on function public.receive_stock_transfer(uuid) from public;
grant execute on function public.receive_stock_transfer(uuid) to authenticated;

-- Role-aware helpers used by the command functions below. Location access and
-- permission to approve/review are intentionally separate concepts: staff can
-- work stock, while managers can approve decisions for their assigned branch.
create or replace function public.is_company_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.company_users cu
     where cu.company_id = public.get_auth_company_id()
       and cu.auth_user_id = auth.uid()
       and cu.status = 'active'
       and cu.role in ('owner', 'admin', 'manager')
  );
$$;
revoke all on function public.is_company_manager() from public;
grant execute on function public.is_company_manager() to authenticated;

create or replace function public.can_manage_location(target_location_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.locations l
      join public.company_users cu
        on cu.company_id = l.company_id
       and cu.auth_user_id = auth.uid()
       and cu.status = 'active'
     where l.id = target_location_id
       and l.company_id = public.get_auth_company_id()
       and (
         public.is_company_admin()
         or (
           cu.role = 'manager'
           and (
             l.manager_user_id = cu.id
             or exists (
               select 1
                 from public.user_locations ul
                where ul.user_id = cu.id
                  and ul.location_id = l.id
             )
           )
         )
       )
  );
$$;
revoke all on function public.can_manage_location(uuid) from public;
grant execute on function public.can_manage_location(uuid) to authenticated;

-- Product catalog maintenance is a manager/admin action. Quantity and lot
-- changes remain command-only and are never direct client writes.
drop policy if exists redesign_products_write on public.products;
create policy redesign_products_write on public.products for all to authenticated
using (company_id = public.get_auth_company_id() and public.is_company_manager())
with check (company_id = public.get_auth_company_id() and public.is_company_manager());

drop policy if exists redesign_stock_lots_write on public.stock_lots;

create or replace function public.submit_stock_count(p_session_id uuid, p_lines jsonb)
returns public.stock_count_sessions
language plpgsql security definer set search_path = public
as $$
declare
  session_row public.stock_count_sessions;
  line jsonb;
  product_id_value uuid;
  counted_value integer;
  expected_value integer;
  reason_value text;
  line_count integer := 0;
begin
  select * into session_row
    from public.stock_count_sessions
   where id = p_session_id
     and company_id = public.get_auth_company_id()
   for update;
  if session_row.id is null or not public.can_access_location(session_row.location_id) then
    raise exception 'Count session not found';
  end if;
  if session_row.status <> 'open' then
    raise exception 'This count is already submitted';
  end if;
  for line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    line_count := line_count + 1;
    product_id_value := (line->>'product_id')::uuid;
    counted_value := (line->>'counted_quantity')::integer;
    reason_value := nullif(trim(line->>'variance_reason'), '');
    if not exists (select 1 from public.products where id = product_id_value and company_id = session_row.company_id and is_active) then
      raise exception 'Count line contains a product outside this company';
    end if;
    select coalesce(sum(quantity_on_hand), 0) into expected_value
      from public.stock_lots
     where company_id = session_row.company_id
       and location_id = session_row.location_id
       and product_id = product_id_value
       and quantity_on_hand > 0;
    if counted_value is null or counted_value < 0 then
      raise exception 'Counted quantity must be zero or greater';
    end if;
    if counted_value <> expected_value and reason_value is null then
      raise exception 'A reason is required when counted quantity differs from expected quantity';
    end if;
    insert into public.stock_count_lines (session_id, product_id, expected_quantity, counted_quantity, variance_reason, status, counted_by_auth_user_id)
    values (session_row.id, product_id_value, expected_value, counted_value, reason_value, case when expected_value = counted_value then 'matched'::public.stock_count_line_status else 'variance'::public.stock_count_line_status end, auth.uid());
  end loop;
  if line_count = 0 then raise exception 'Add at least one product to the count'; end if;
  update public.stock_count_sessions set status = 'submitted', submitted_at = now(), updated_at = now() where id = session_row.id returning * into session_row;
  return session_row;
end;
$$;
revoke all on function public.submit_stock_count(uuid, jsonb) from public;
grant execute on function public.submit_stock_count(uuid, jsonb) to authenticated;

create or replace function public.review_stock_count(p_session_id uuid, p_approve boolean, p_note text default null)
returns public.stock_count_sessions
language plpgsql security definer set search_path = public
as $$
declare
  session_row public.stock_count_sessions;
  company_user_id_value uuid;
  line_row record;
  lot_row public.stock_lots;
  delta_value integer;
  remaining_value integer;
  take_value integer;
begin
  select * into session_row
    from public.stock_count_sessions
   where id = p_session_id
     and company_id = public.get_auth_company_id()
   for update;
  if session_row.id is null or not public.can_manage_location(session_row.location_id) then
    raise exception 'Count session not found';
  end if;
  if session_row.status <> 'submitted' then raise exception 'Only submitted counts can be reviewed'; end if;
  select id into company_user_id_value from public.company_users where company_id = session_row.company_id and auth_user_id = auth.uid() limit 1;
  if not p_approve then
    update public.stock_count_sessions set status = 'rejected', notes = p_note, reviewed_by_company_user_id = company_user_id_value, reviewed_at = now(), updated_at = now() where id = session_row.id returning * into session_row;
    return session_row;
  end if;
  for line_row in select * from public.stock_count_lines where session_id = session_row.id for update loop
    delta_value := coalesce(line_row.counted_quantity, 0) - line_row.expected_quantity;
    if delta_value > 0 then
      select * into lot_row from public.stock_lots where company_id = session_row.company_id and location_id = session_row.location_id and product_id = line_row.product_id and status = 'available' order by expiry_date nulls last, received_at for update limit 1;
      if lot_row.id is null then raise exception 'Cannot add counted stock for a product with no available lot'; end if;
      update public.stock_lots set quantity_on_hand = quantity_on_hand + delta_value, updated_at = now() where id = lot_row.id;
      insert into public.stock_movements (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by_auth_user_id) values (session_row.company_id, line_row.product_id, lot_row.id, session_row.location_id, 'count_adjustment', delta_value, 'count_session', session_row.id, 'Approved stock count adjustment', auth.uid());
    elsif delta_value < 0 then
      remaining_value := abs(delta_value);
      for lot_row in select * from public.stock_lots where company_id = session_row.company_id and location_id = session_row.location_id and product_id = line_row.product_id and quantity_on_hand > 0 order by expiry_date nulls first, received_at for update loop
        exit when remaining_value <= 0;
        take_value := least(remaining_value, lot_row.quantity_on_hand);
        update public.stock_lots set quantity_on_hand = quantity_on_hand - take_value, status = case when quantity_on_hand - take_value = 0 then 'depleted'::public.stock_lot_status else status end, updated_at = now() where id = lot_row.id;
        insert into public.stock_movements (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by_auth_user_id) values (session_row.company_id, line_row.product_id, lot_row.id, session_row.location_id, 'count_adjustment', -take_value, 'count_session', session_row.id, 'Approved stock count adjustment', auth.uid());
        remaining_value := remaining_value - take_value;
      end loop;
    end if;
    update public.stock_count_lines set status = 'approved', updated_at = now() where id = line_row.id;
  end loop;
  update public.stock_count_sessions set status = 'approved', notes = p_note, reviewed_by_company_user_id = company_user_id_value, reviewed_at = now(), updated_at = now() where id = session_row.id returning * into session_row;
  return session_row;
end;
$$;
revoke all on function public.review_stock_count(uuid, boolean, text) from public;
grant execute on function public.review_stock_count(uuid, boolean, text) to authenticated;

create or replace function public.update_supplier_request_status(p_request_id uuid, p_status public.supplier_request_status)
returns public.supplier_requests
language plpgsql security definer set search_path = public
as $$
declare result_row public.supplier_requests;
begin
  update public.supplier_requests
     set status = p_status,
         last_contacted_at = case when p_status = 'contacted' then now() else last_contacted_at end,
         updated_at = now()
   where id = p_request_id
     and company_id = public.get_auth_company_id()
     and public.can_manage_location(location_id)
  returning * into result_row;
  if result_row.id is null then raise exception 'Supplier request not found'; end if;
  return result_row;
end;
$$;
revoke all on function public.update_supplier_request_status(uuid, public.supplier_request_status) from public;
grant execute on function public.update_supplier_request_status(uuid, public.supplier_request_status) to authenticated;

create or replace function public.approve_stock_transfer(p_transfer_id uuid, p_approve boolean, p_note text default null)
returns public.stock_transfers
language plpgsql security definer set search_path = public
as $$
declare
  transfer_row public.stock_transfers;
  line_row record;
  lot_row public.stock_lots;
  company_user_id_value uuid;
  remaining_value integer;
  approved_value integer;
  first_lot boolean;
begin
  select * into transfer_row from public.stock_transfers where id = p_transfer_id and company_id = public.get_auth_company_id() for update;
  if transfer_row.id is null or not public.can_manage_location(transfer_row.source_location_id) then raise exception 'Transfer not found'; end if;
  if transfer_row.status <> 'requested' then raise exception 'This transfer is no longer awaiting approval'; end if;
  select id into company_user_id_value from public.company_users where company_id = transfer_row.company_id and auth_user_id = auth.uid() limit 1;
  if not p_approve then
    update public.stock_transfers set status = 'rejected', decision_note = p_note, reviewed_by_company_user_id = company_user_id_value, updated_at = now() where id = transfer_row.id returning * into transfer_row;
    return transfer_row;
  end if;
  for line_row in select * from public.stock_transfer_lines where transfer_id = transfer_row.id for update loop
    remaining_value := line_row.quantity_requested;
    first_lot := true;
    for lot_row in select * from public.stock_lots where company_id = transfer_row.company_id and location_id = transfer_row.source_location_id and product_id = line_row.product_id and quantity_on_hand > 0 and status = 'available' order by expiry_date nulls last, received_at for update loop
      exit when remaining_value <= 0;
      approved_value := least(remaining_value, lot_row.quantity_on_hand);
      if first_lot then
        update public.stock_transfer_lines set source_lot_id = lot_row.id, quantity_approved = approved_value where id = line_row.id;
        first_lot := false;
      else
        insert into public.stock_transfer_lines (transfer_id, product_id, source_lot_id, quantity_requested, quantity_approved) values (transfer_row.id, line_row.product_id, lot_row.id, approved_value, approved_value);
      end if;
      remaining_value := remaining_value - approved_value;
    end loop;
    if remaining_value > 0 then raise exception 'There is not enough available stock to approve this transfer'; end if;
  end loop;
  update public.stock_transfers set status = 'in_transit', decision_note = p_note, reviewed_by_company_user_id = company_user_id_value, approved_at = now(), updated_at = now() where id = transfer_row.id returning * into transfer_row;
  return transfer_row;
end;
$$;
revoke all on function public.approve_stock_transfer(uuid, boolean, text) from public;
grant execute on function public.approve_stock_transfer(uuid, boolean, text) to authenticated;

-- Partial receipt support: a destination can confirm what physically arrived
-- without silently forcing every line to its approved quantity.
drop function if exists public.receive_stock_transfer_partial(uuid, jsonb);
create or replace function public.receive_stock_transfer_partial(p_transfer_id uuid, p_lines jsonb, p_note text default null)
returns public.stock_transfers
language plpgsql security definer set search_path = public
as $$
declare
  transfer_row public.stock_transfers;
  line_row record;
  source_lot public.stock_lots;
  destination_lot public.stock_lots;
  company_user_id_value uuid;
  requested_line jsonb;
  receive_quantity integer;
  remaining_quantity integer;
  has_received boolean := false;
  all_received boolean := true;
begin
  select * into transfer_row
    from public.stock_transfers
   where id = p_transfer_id
     and company_id = public.get_auth_company_id()
   for update;

  if transfer_row.id is null or not public.can_access_location(transfer_row.destination_location_id) then
    raise exception 'Transfer not found';
  end if;
  if transfer_row.status not in ('approved', 'in_transit', 'partially_received') then
    raise exception 'This transfer cannot be received';
  end if;

  select id into company_user_id_value
    from public.company_users
   where company_id = transfer_row.company_id
     and auth_user_id = auth.uid()
   limit 1;

  -- Validate every requested line before changing stock so a bad receipt cannot
  -- leave a multi-line transfer half-mutated.
  for line_row in
    select l.*, coalesce(l.quantity_approved, l.quantity_requested) as approved_quantity
      from public.stock_transfer_lines l
     where l.transfer_id = transfer_row.id
     for update
  loop
    requested_line := (
      select value
        from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) value
       where value->>'line_id' = line_row.id::text
       limit 1
    );
    receive_quantity := coalesce((requested_line->>'quantity_received')::integer, 0);
    remaining_quantity := line_row.approved_quantity - line_row.quantity_received;
    if receive_quantity < 0 or receive_quantity > remaining_quantity then
      raise exception 'Received quantity is greater than the remaining approved quantity';
    end if;
    if receive_quantity > 0 then
      has_received := true;
    end if;
    if line_row.quantity_received + receive_quantity < line_row.approved_quantity then
      all_received := false;
    end if;
  end loop;

  if not has_received and nullif(trim(p_note), '') is null then
    raise exception 'Add a note when none of the requested stock arrived';
  end if;
  if not all_received and nullif(trim(p_note), '') is null then
    raise exception 'Add a note explaining the receiving difference';
  end if;

  for line_row in
    select l.*, coalesce(l.quantity_approved, l.quantity_requested) as approved_quantity
      from public.stock_transfer_lines l
     where l.transfer_id = transfer_row.id
     for update
  loop
    requested_line := (
      select value
        from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) value
       where value->>'line_id' = line_row.id::text
       limit 1
    );
    receive_quantity := coalesce((requested_line->>'quantity_received')::integer, 0);
    if receive_quantity = 0 then
      continue;
    end if;

    select * into source_lot
      from public.stock_lots
     where id = line_row.source_lot_id
     for update;
    if source_lot.id is null or source_lot.quantity_on_hand < receive_quantity then
      raise exception 'Source stock is no longer available';
    end if;

    update public.stock_lots
       set quantity_on_hand = quantity_on_hand - receive_quantity,
           status = case when quantity_on_hand - receive_quantity = 0
                    then 'depleted'::public.stock_lot_status else status end,
           updated_at = now()
     where id = source_lot.id;

    insert into public.stock_movements
      (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by_auth_user_id)
    values
      (transfer_row.company_id, source_lot.product_id, source_lot.id, source_lot.location_id, 'transfer_out', -receive_quantity, 'stock_transfer', transfer_row.id, 'Transfer sent', auth.uid());

    insert into public.stock_lots
      (company_id, product_id, location_id, supplier_id, lot_number, received_at, manufactured_at, expiry_date, expiry_notification_days, quantity_on_hand, unit_cost, status, notes)
    values
      (source_lot.company_id, source_lot.product_id, transfer_row.destination_location_id, source_lot.supplier_id, source_lot.lot_number, now(), source_lot.manufactured_at, source_lot.expiry_date, source_lot.expiry_notification_days, receive_quantity, source_lot.unit_cost, 'available', 'Received from stock transfer ' || left(transfer_row.id::text, 8))
    returning * into destination_lot;

    insert into public.stock_movements
      (company_id, product_id, stock_lot_id, location_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by_auth_user_id)
    values
      (transfer_row.company_id, destination_lot.product_id, destination_lot.id, destination_lot.location_id, 'transfer_in', receive_quantity, 'stock_transfer', transfer_row.id, 'Transfer received', auth.uid());

    update public.stock_transfer_lines
       set quantity_received = quantity_received + receive_quantity
     where id = line_row.id;
  end loop;

  update public.stock_transfers
     set status = case when all_received then 'received'::public.inventory_transfer_status else 'partially_received'::public.inventory_transfer_status end,
         note = coalesce(nullif(trim(p_note), ''), note),
         received_by_company_user_id = company_user_id_value,
         received_at = case when all_received then now() else received_at end,
         updated_at = now()
   where id = transfer_row.id
  returning * into transfer_row;
  return transfer_row;
end;
$$;
revoke all on function public.receive_stock_transfer_partial(uuid, jsonb, text) from public;
grant execute on function public.receive_stock_transfer_partial(uuid, jsonb, text) to authenticated;

-- Persist the action queue so notifications survive reloads and can be
-- acknowledged independently from the underlying stock record. The sync
-- function only creates notifications for the signed-in user and respects
-- the same location boundaries as the operational RPCs.
create unique index if not exists notifications_open_reference_idx
  on public.notifications (recipient_company_user_id, notification_type, reference_type, reference_id)
  where is_resolved = false;

create or replace function public.sync_stocky_notifications()
returns setof public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  company_id_value uuid;
begin
  select cu.id, cu.company_id
    into current_user_id, company_id_value
    from public.company_users cu
   where cu.auth_user_id = auth.uid()
     and cu.status = 'active'
   limit 1;

  if current_user_id is null or company_id_value is null then
    return;
  end if;

  -- Clear queue entries whose underlying work is no longer actionable. A new
  -- open notification can be created later if the condition returns.
  update public.notifications n
     set is_resolved = true, resolved_at = now()
   where n.recipient_company_user_id = current_user_id
     and n.company_id = company_id_value
     and n.is_resolved = false
     and (
       (n.notification_type in ('expiry', 'data_quality') and n.reference_type = 'stock_lot' and not exists (
         select 1
           from public.stock_lots sl
          where sl.id = n.reference_id
            and sl.company_id = company_id_value
            and sl.quantity_on_hand > 0
            and (
              (n.notification_type = 'expiry' and sl.expiry_date is not null and (sl.expiry_date < now() or sl.expiry_date <= now() + interval '1 day' * coalesce(sl.expiry_notification_days, 0)))
              or (n.notification_type = 'data_quality' and sl.expiry_date is null)
            )
       ))
       or (n.notification_type = 'count_review' and n.reference_type = 'stock_count_session' and not exists (
         select 1 from public.stock_count_sessions s where s.id = n.reference_id and s.company_id = company_id_value and s.status = 'submitted' and public.can_manage_location(s.location_id)
       ))
       or (n.notification_type = 'transfer' and n.reference_type = 'stock_transfer' and not exists (
         select 1 from public.stock_transfers t where t.id = n.reference_id and t.company_id = company_id_value and ((t.status = 'requested' and public.can_manage_location(t.source_location_id)) or (t.status in ('approved', 'in_transit', 'partially_received') and public.can_manage_location(t.destination_location_id)))
       ))
       or (n.notification_type = 'supplier_request' and n.reference_type = 'supplier_request' and not exists (
         select 1 from public.supplier_requests sr where sr.id = n.reference_id and sr.company_id = company_id_value and sr.status not in ('closed', 'cancelled') and public.can_manage_location(sr.location_id)
       ))
     );

  -- Expiry work is visible to staff, managers, and admins for locations they
  -- can access. Notification days remain batch-specific.
  insert into public.notifications (company_id, recipient_company_user_id, notification_type, severity, title, message, reference_type, reference_id)
  select company_id_value,
         current_user_id,
         'expiry'::public.notification_type,
         case when sl.expiry_date < now() then 'critical'::public.notification_severity else 'warning'::public.notification_severity end,
         case when sl.expiry_date < now() then p.name || ' is expired' else p.name || ' is expiring soon' end,
         format('%s units at %s · batch %s · %s', sl.quantity_on_hand, l.name, coalesce(sl.lot_number, 'not recorded'), to_char(sl.expiry_date, 'DD Mon YYYY')),
         'stock_lot',
         sl.id
    from public.stock_lots sl
    join public.products p on p.id = sl.product_id
    join public.locations l on l.id = sl.location_id
   where sl.company_id = company_id_value
     and sl.quantity_on_hand > 0
     and sl.expiry_date is not null
     and (sl.expiry_date < now() or sl.expiry_date <= now() + interval '1 day' * coalesce(sl.expiry_notification_days, 0))
     and public.can_access_location(sl.location_id)
     and not exists (
       select 1 from public.notifications n
        where n.recipient_company_user_id = current_user_id
          and n.notification_type = 'expiry'
          and n.reference_type = 'stock_lot'
          and n.reference_id = sl.id
          and n.is_resolved = false
     );

  -- Missing expiry dates are a data-quality task because the item cannot be
  -- safely managed through the expiry queue until the batch is completed.
  insert into public.notifications (company_id, recipient_company_user_id, notification_type, severity, title, message, reference_type, reference_id)
  select company_id_value,
         current_user_id,
         'data_quality'::public.notification_type,
         'warning'::public.notification_severity,
         p.name || ' has no expiry date',
         format('%s units at %s · batch %s', sl.quantity_on_hand, l.name, coalesce(sl.lot_number, 'not recorded')),
         'stock_lot',
         sl.id
    from public.stock_lots sl
    join public.products p on p.id = sl.product_id
    join public.locations l on l.id = sl.location_id
   where sl.company_id = company_id_value
     and sl.quantity_on_hand > 0
     and sl.expiry_date is null
     and public.can_access_location(sl.location_id)
     and not exists (
       select 1 from public.notifications n
        where n.recipient_company_user_id = current_user_id
          and n.notification_type = 'data_quality'
          and n.reference_type = 'stock_lot'
          and n.reference_id = sl.id
          and n.is_resolved = false
     );

  -- Low and out-of-stock products are calculated per location so a product
  -- can be healthy in one branch and urgent in another.
  insert into public.notifications (company_id, recipient_company_user_id, notification_type, severity, title, message, reference_type, reference_id)
  select company_id_value,
         current_user_id,
         'low_stock'::public.notification_type,
         case when coalesce(sum(sl.quantity_on_hand), 0) = 0 then 'critical'::public.notification_severity else 'warning'::public.notification_severity end,
         case when coalesce(sum(sl.quantity_on_hand), 0) = 0 then p.name || ' is out of stock' else p.name || ' is low' end,
         format('%s %s at %s · reorder point %s', coalesce(sum(sl.quantity_on_hand), 0), p.unit_name, l.name, p.reorder_point),
         'low_stock',
         md5(p.id::text || ':' || l.id::text)::uuid
    from public.products p
    join public.locations l on l.company_id = company_id_value and l.is_active and public.can_access_location(l.id)
    left join public.stock_lots sl on sl.company_id = company_id_value and sl.product_id = p.id and sl.location_id = l.id and sl.quantity_on_hand > 0
   where p.company_id = company_id_value and p.is_active
   group by p.id, p.name, p.unit_name, p.reorder_point, l.id, l.name
   having coalesce(sum(sl.quantity_on_hand), 0) <= p.reorder_point
      and not exists (
        select 1 from public.notifications n
         where n.recipient_company_user_id = current_user_id
           and n.notification_type = 'low_stock'
           and n.reference_type = 'low_stock'
           and n.reference_id = md5(p.id::text || ':' || l.id::text)::uuid
           and n.is_resolved = false
      );

  insert into public.notifications (company_id, recipient_company_user_id, notification_type, severity, title, message, reference_type, reference_id)
  select company_id_value,
         current_user_id,
         'count_review'::public.notification_type,
         'info'::public.notification_severity,
         'Stock count ready for review',
         format('%s submitted a count for %s', coalesce(cu.full_name, 'A team member'), l.name),
         'stock_count_session',
         s.id
    from public.stock_count_sessions s
    join public.locations l on l.id = s.location_id
    left join public.company_users cu on cu.id = s.started_by_company_user_id
   where s.company_id = company_id_value
     and s.status = 'submitted'
     and public.can_manage_location(s.location_id)
     and not exists (
       select 1 from public.notifications n
        where n.recipient_company_user_id = current_user_id
          and n.notification_type = 'count_review'
          and n.reference_type = 'stock_count_session'
          and n.reference_id = s.id
          and n.is_resolved = false
     );

  insert into public.notifications (company_id, recipient_company_user_id, notification_type, severity, title, message, reference_type, reference_id)
  select company_id_value,
         current_user_id,
         'transfer'::public.notification_type,
         'info'::public.notification_severity,
         case when t.status = 'requested' then 'Transfer request needs approval' else 'Transfer is ready to receive' end,
         format('%s → %s · %s', source_location.name, destination_location.name, replace(t.status::text, '_', ' ')),
         'stock_transfer',
         t.id
    from public.stock_transfers t
    join public.locations source_location on source_location.id = t.source_location_id
    join public.locations destination_location on destination_location.id = t.destination_location_id
   where t.company_id = company_id_value
     and ((t.status = 'requested' and public.can_manage_location(t.source_location_id)) or (t.status in ('approved', 'in_transit', 'partially_received') and public.can_manage_location(t.destination_location_id)))
     and not exists (
       select 1 from public.notifications n
        where n.recipient_company_user_id = current_user_id
          and n.notification_type = 'transfer'
          and n.reference_type = 'stock_transfer'
          and n.reference_id = t.id
          and n.is_resolved = false
     );

  insert into public.notifications (company_id, recipient_company_user_id, notification_type, severity, title, message, reference_type, reference_id)
  select company_id_value,
         current_user_id,
         'supplier_request'::public.notification_type,
         'info'::public.notification_severity,
         'Supplier follow-up needed',
         format('%s request at %s · %s', sr.request_type::text, l.name, replace(sr.status::text, '_', ' ')),
         'supplier_request',
         sr.id
    from public.supplier_requests sr
    join public.locations l on l.id = sr.location_id
   where sr.company_id = company_id_value
     and sr.status not in ('closed', 'cancelled')
     and public.can_manage_location(sr.location_id)
     and not exists (
       select 1 from public.notifications n
        where n.recipient_company_user_id = current_user_id
          and n.notification_type = 'supplier_request'
          and n.reference_type = 'supplier_request'
          and n.reference_id = sr.id
          and n.is_resolved = false
     );

  return query
    select n.*
      from public.notifications n
     where n.recipient_company_user_id = current_user_id
       and n.company_id = company_id_value
       and n.is_resolved = false
     order by n.created_at desc;
end;
$$;
revoke all on function public.sync_stocky_notifications() from public;
grant execute on function public.sync_stocky_notifications() to authenticated;

create or replace function public.mark_stocky_notification_read(p_notification_id uuid)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare result_row public.notifications;
begin
  update public.notifications n
     set is_read = true
   where n.id = p_notification_id
     and exists (select 1 from public.company_users cu where cu.id = n.recipient_company_user_id and cu.auth_user_id = auth.uid() and cu.status = 'active')
  returning n.* into result_row;
  if result_row.id is null then raise exception 'Notification not found'; end if;
  return result_row;
end;
$$;
revoke all on function public.mark_stocky_notification_read(uuid) from public;
grant execute on function public.mark_stocky_notification_read(uuid) to authenticated;

create or replace function public.resolve_stocky_notification(p_notification_id uuid)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare result_row public.notifications;
begin
  update public.notifications n
     set is_read = true, is_resolved = true, resolved_at = now()
   where n.id = p_notification_id
     and exists (select 1 from public.company_users cu where cu.id = n.recipient_company_user_id and cu.auth_user_id = auth.uid() and cu.status = 'active')
  returning n.* into result_row;
  if result_row.id is null then raise exception 'Notification not found'; end if;
  return result_row;
end;
$$;
revoke all on function public.resolve_stocky_notification(uuid) from public;
grant execute on function public.resolve_stocky_notification(uuid) to authenticated;

-- Staff can receive a barcode that is not yet in the catalog without gaining
-- direct product-table write access. Stocky creates a clearly named product
-- record and records the receipt through the same transactional receive path.
create or replace function public.receive_unidentified_stock(
  p_barcode text,
  p_product_name text,
  p_location_id uuid,
  p_quantity integer,
  p_lot_number text default null,
  p_expiry_date timestamptz default null,
  p_expiry_notification_days integer default null,
  p_unit_cost numeric default 0,
  p_notes text default null
)
returns public.stock_lots
language plpgsql
security definer
set search_path = public
as $$
declare
  company_id_value uuid;
  product_id_value uuid;
  result_row public.stock_lots;
  clean_name text := nullif(trim(p_product_name), '');
  clean_barcode text := nullif(trim(p_barcode), '');
begin
  company_id_value := public.get_auth_company_id();
  if company_id_value is null or not public.can_access_location(p_location_id) then raise exception 'You do not have access to this location'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if clean_name is null then raise exception 'Product name is required'; end if;
  if p_expiry_notification_days is not null and p_expiry_notification_days < 0 then raise exception 'Notification days must be zero or greater'; end if;
  if p_unit_cost is null or p_unit_cost < 0 then raise exception 'Unit cost must be zero or greater'; end if;

  select id into product_id_value
    from public.products
   where company_id = company_id_value
     and clean_barcode is not null
     and barcode = clean_barcode
   limit 1;

  if product_id_value is null then
    insert into public.products (company_id, name, barcode, category_name, unit_name, default_expiry_notification_days, unit_cost, is_active)
    values (company_id_value, clean_name, clean_barcode, 'Unidentified', 'unit', p_expiry_notification_days, p_unit_cost, true)
    returning id into product_id_value;
  end if;

  select * into result_row
    from public.receive_stock(product_id_value, p_location_id, p_quantity, p_lot_number, p_expiry_date, p_expiry_notification_days, null, p_unit_cost, coalesce(p_notes, 'Received as an unidentified barcode'));
  return result_row;
end;
$$;
revoke all on function public.receive_unidentified_stock(text, text, uuid, integer, text, timestamptz, integer, numeric, text) from public;
grant execute on function public.receive_unidentified_stock(text, text, uuid, integer, text, timestamptz, integer, numeric, text) to authenticated;

create or replace function public.update_stock_lot_details(
  p_lot_id uuid,
  p_lot_number text default null,
  p_expiry_date timestamptz default null,
  p_expiry_notification_days integer default null
)
returns public.stock_lots
language plpgsql
security definer
set search_path = public
as $$
declare result_row public.stock_lots;
begin
  if p_expiry_notification_days is not null and p_expiry_notification_days < 0 then raise exception 'Notification days must be zero or greater'; end if;
  update public.stock_lots sl
     set lot_number = nullif(trim(p_lot_number), ''),
         expiry_date = p_expiry_date,
         expiry_notification_days = p_expiry_notification_days,
         updated_at = now()
   where sl.id = p_lot_id
     and sl.company_id = public.get_auth_company_id()
     and public.can_access_location(sl.location_id)
  returning sl.* into result_row;
  if result_row.id is null then raise exception 'Stock lot not found'; end if;
  return result_row;
end;
$$;
revoke all on function public.update_stock_lot_details(uuid, text, timestamptz, integer) from public;
grant execute on function public.update_stock_lot_details(uuid, text, timestamptz, integer) to authenticated;

-- Keep the original all-at-once command for existing clients while routing it
-- through the same audited partial-receipt implementation.
create or replace function public.receive_stock_transfer(p_transfer_id uuid)
returns public.stock_transfers
language plpgsql security definer set search_path = public
as $$
declare result_row public.stock_transfers;
begin
  select * into result_row
    from public.receive_stock_transfer_partial(
      p_transfer_id,
      (select jsonb_agg(jsonb_build_object('line_id', id, 'quantity_received', coalesce(quantity_approved, quantity_requested) - quantity_received))
         from public.stock_transfer_lines
        where transfer_id = p_transfer_id),
      null
    );
  return result_row;
end;
$$;
revoke all on function public.receive_stock_transfer(uuid) from public;
grant execute on function public.receive_stock_transfer(uuid) to authenticated;
