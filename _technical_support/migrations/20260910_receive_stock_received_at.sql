-- Keep the stock receipt date supplied by the user instead of always using
-- the database clock. The existing receive_stock command remains available
-- for older callers; the drawer uses this explicit command.
create or replace function public.receive_stock_with_received_at(
  p_product_id uuid,
  p_location_id uuid,
  p_quantity integer,
  p_lot_number text default null,
  p_expiry_date timestamptz default null,
  p_expiry_notification_days integer default null,
  p_supplier_id uuid default null,
  p_unit_cost numeric default 0,
  p_notes text default null,
  p_received_at timestamptz default now()
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
  if p_supplier_id is null or not exists (
    select 1
    from public.suppliers
    where id = p_supplier_id
      and company_id = company_id_value
  ) then
    raise exception 'A supplier from your company is required';
  end if;

  select * into lot_row
  from public.receive_stock(
    p_product_id,
    p_location_id,
    p_quantity,
    p_lot_number,
    p_expiry_date,
    p_expiry_notification_days,
    p_supplier_id,
    p_unit_cost,
    p_notes
  );

  update public.stock_lots
     set received_at = coalesce(p_received_at, now()),
         updated_at = now()
   where id = lot_row.id
   returning * into lot_row;

  return lot_row;
end;
$$;

revoke all on function public.receive_stock_with_received_at(uuid, uuid, integer, text, timestamptz, integer, uuid, numeric, text, timestamptz) from public;
grant execute on function public.receive_stock_with_received_at(uuid, uuid, integer, text, timestamptz, integer, uuid, numeric, text, timestamptz) to authenticated;
