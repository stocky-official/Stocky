-- Branch-to-branch stock transfer workflow.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'stock_transfer_status') then
    create type public.stock_transfer_status as enum (
      'pending',
      'approved',
      'rejected',
      'completed',
      'cancelled'
    );
  end if;
end
$$;

create table if not exists public.stock_transfer_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_branch_id uuid not null references public.branches(id) on delete restrict,
  destination_branch_id uuid not null references public.branches(id) on delete restrict,
  source_item_id uuid references public.items(id) on delete set null,
  destination_item_id uuid references public.items(id) on delete set null,
  product_name varchar(255) not null,
  category_name varchar(150),
  barcode varchar(100),
  quantity_requested integer not null,
  quantity_approved integer,
  status public.stock_transfer_status not null default 'pending',
  note text,
  decision_note text,
  requested_by_auth_user_id uuid not null,
  reviewed_by_auth_user_id uuid,
  reviewed_at timestamptz,
  received_by_auth_user_id uuid,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_transfer_branches_check check (source_branch_id <> destination_branch_id),
  constraint stock_transfer_requested_quantity_check check (quantity_requested > 0),
  constraint stock_transfer_approved_quantity_check check (
    quantity_approved is null or (quantity_approved > 0 and quantity_approved <= quantity_requested)
  )
);

create index if not exists stock_transfer_company_status_idx
  on public.stock_transfer_requests(company_id, status, created_at desc);

create index if not exists stock_transfer_source_branch_idx
  on public.stock_transfer_requests(company_id, source_branch_id, status);

create index if not exists stock_transfer_destination_branch_idx
  on public.stock_transfer_requests(company_id, destination_branch_id, status);

alter table public.stock_transfer_requests enable row level security;

drop policy if exists stock_transfer_select on public.stock_transfer_requests;
drop policy if exists stock_transfer_insert on public.stock_transfer_requests;

create policy stock_transfer_select on public.stock_transfer_requests
for select to authenticated
using (
  company_id = public.get_auth_company_id()
  and (
    public.is_company_admin()
    or public.can_access_branch(source_branch_id)
    or public.can_access_branch(destination_branch_id)
  )
);

create policy stock_transfer_insert on public.stock_transfer_requests
for insert to authenticated
with check (
  company_id = public.get_auth_company_id()
  and status = 'pending'::public.stock_transfer_status
  and requested_by_auth_user_id = auth.uid()
  and source_branch_id <> destination_branch_id
  and public.can_access_branch(destination_branch_id)
  and exists (
    select 1
    from public.branches source_branch
    join public.branches destination_branch on destination_branch.company_id = source_branch.company_id
    where source_branch.id = stock_transfer_requests.source_branch_id
      and destination_branch.id = stock_transfer_requests.destination_branch_id
      and source_branch.company_id = public.get_auth_company_id()
  )
  and (
    source_item_id is null
    or exists (
      select 1
      from public.items source_item
      where source_item.id = stock_transfer_requests.source_item_id
        and source_item.company_id = public.get_auth_company_id()
        and source_item.branch_id = stock_transfer_requests.source_branch_id
    )
  )
);

create or replace function public.review_stock_transfer(
  p_request_id uuid,
  p_approve boolean,
  p_approved_quantity integer default null,
  p_decision_note text default null
)
returns setof public.stock_transfer_requests
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  request_row public.stock_transfer_requests%rowtype;
  source_item_row public.items%rowtype;
  approved_quantity_value integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select * into request_row
  from public.stock_transfer_requests
  where id = p_request_id
  for update;

  if not found or request_row.company_id <> public.get_auth_company_id() then
    raise exception 'Transfer request not found';
  end if;

  if not (
    public.is_company_admin()
    or (
      public.get_auth_user_role() = 'manager'
      and public.can_access_branch(request_row.source_branch_id)
    )
  ) then
    raise exception 'Only the source branch manager or a company administrator can review this request';
  end if;

  if request_row.status <> 'pending'::public.stock_transfer_status then
    raise exception 'Only pending transfer requests can be reviewed';
  end if;

  if p_approve then
    approved_quantity_value := coalesce(p_approved_quantity, request_row.quantity_requested);
    if approved_quantity_value <= 0 or approved_quantity_value > request_row.quantity_requested then
      raise exception 'Approved quantity must be between 1 and the requested quantity';
    end if;

    if request_row.source_item_id is not null then
      select * into source_item_row
      from public.items
      where id = request_row.source_item_id
        and company_id = request_row.company_id
        and branch_id = request_row.source_branch_id
      for update;
    elsif request_row.barcode is not null then
      select * into source_item_row
      from public.items
      where company_id = request_row.company_id
        and branch_id = request_row.source_branch_id
        and barcode = request_row.barcode
      order by quantity desc
      limit 1
      for update;
    else
      select * into source_item_row
      from public.items
      where company_id = request_row.company_id
        and branch_id = request_row.source_branch_id
        and lower(name) = lower(request_row.product_name)
      order by quantity desc
      limit 1
      for update;
    end if;

    if not found then
      raise exception 'The requested product was not found in the source branch';
    end if;

    if source_item_row.quantity < approved_quantity_value then
      raise exception 'The source branch does not have enough stock to approve this request';
    end if;

    update public.stock_transfer_requests
    set status = 'approved'::public.stock_transfer_status,
        quantity_approved = approved_quantity_value,
        decision_note = nullif(trim(p_decision_note), ''),
        reviewed_by_auth_user_id = auth.uid(),
        reviewed_at = now(),
        updated_at = now()
    where id = request_row.id;
  else
    update public.stock_transfer_requests
    set status = 'rejected'::public.stock_transfer_status,
        quantity_approved = null,
        decision_note = nullif(trim(p_decision_note), ''),
        reviewed_by_auth_user_id = auth.uid(),
        reviewed_at = now(),
        updated_at = now()
    where id = request_row.id;
  end if;

  return query select * from public.stock_transfer_requests where id = request_row.id;
end;
$$;

create or replace function public.receive_stock_transfer(p_request_id uuid)
returns setof public.stock_transfer_requests
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  request_row public.stock_transfer_requests%rowtype;
  source_item_row public.items%rowtype;
  destination_item_row public.items%rowtype;
  transfer_quantity integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select * into request_row
  from public.stock_transfer_requests
  where id = p_request_id
  for update;

  if not found or request_row.company_id <> public.get_auth_company_id() then
    raise exception 'Transfer request not found';
  end if;

  if not (
    public.is_company_admin()
    or (
      public.get_auth_user_role() = 'manager'
      and public.can_access_branch(request_row.destination_branch_id)
    )
  ) then
    raise exception 'Only the destination branch manager or a company administrator can receive this request';
  end if;

  if request_row.status <> 'approved'::public.stock_transfer_status then
    raise exception 'Only approved transfer requests can be received';
  end if;

  transfer_quantity := coalesce(request_row.quantity_approved, request_row.quantity_requested);

  if request_row.source_item_id is not null then
    select * into source_item_row
    from public.items
    where id = request_row.source_item_id
      and company_id = request_row.company_id
      and branch_id = request_row.source_branch_id
    for update;
  elsif request_row.barcode is not null then
    select * into source_item_row
    from public.items
    where company_id = request_row.company_id
      and branch_id = request_row.source_branch_id
      and barcode = request_row.barcode
    order by quantity desc
    limit 1
    for update;
  else
    select * into source_item_row
    from public.items
    where company_id = request_row.company_id
      and branch_id = request_row.source_branch_id
      and lower(name) = lower(request_row.product_name)
    order by quantity desc
    limit 1
    for update;
  end if;

  if not found then
    raise exception 'The requested product is no longer available in the source branch';
  end if;

  if source_item_row.quantity < transfer_quantity then
    raise exception 'The source branch no longer has enough stock to complete this transfer';
  end if;

  update public.items
  set quantity = quantity - transfer_quantity,
      updated_at = now()
  where id = source_item_row.id;

  if request_row.barcode is not null then
    select * into destination_item_row
    from public.items
    where company_id = request_row.company_id
      and branch_id = request_row.destination_branch_id
      and barcode = request_row.barcode
    order by quantity desc
    limit 1
    for update;
  else
    select * into destination_item_row
    from public.items
    where company_id = request_row.company_id
      and branch_id = request_row.destination_branch_id
      and lower(name) = lower(request_row.product_name)
    order by quantity desc
    limit 1
    for update;
  end if;

  if found then
    update public.items
    set quantity = quantity + transfer_quantity,
        updated_at = now()
    where id = destination_item_row.id;
  else
    insert into public.items (
      company_id,
      branch_id,
      category_id,
      category_name,
      name,
      barcode,
      balance,
      quantity,
      expiry_date,
      expiry_notification_days,
      created_at,
      updated_at
    ) values (
      request_row.company_id,
      request_row.destination_branch_id,
      source_item_row.category_id,
      coalesce(request_row.category_name, source_item_row.category_name),
      request_row.product_name,
      request_row.barcode,
      source_item_row.balance,
      transfer_quantity,
      source_item_row.expiry_date,
      source_item_row.expiry_notification_days,
      now(),
      now()
    )
    returning * into destination_item_row;
  end if;

  update public.stock_transfer_requests
  set status = 'completed'::public.stock_transfer_status,
      destination_item_id = destination_item_row.id,
      received_by_auth_user_id = auth.uid(),
      received_at = now(),
      updated_at = now()
  where id = request_row.id;

  return query select * from public.stock_transfer_requests where id = request_row.id;
end;
$$;

revoke all on function public.review_stock_transfer(uuid, boolean, integer, text) from public;
revoke all on function public.receive_stock_transfer(uuid) from public;
grant execute on function public.review_stock_transfer(uuid, boolean, integer, text) to authenticated;
grant execute on function public.receive_stock_transfer(uuid) to authenticated;

create or replace function public.list_transfer_branches()
returns table (
  id uuid,
  name varchar,
  code varchar
)
language sql
security definer
set search_path = public, auth
as $$
  select b.id, b.name, b.code
  from public.branches b
  where b.company_id = public.get_auth_company_id()
  order by b.name;
$$;

revoke all on function public.list_transfer_branches() from public;
grant execute on function public.list_transfer_branches() to authenticated;

commit;
