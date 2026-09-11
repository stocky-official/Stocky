-- Lot-level actions used by the stock table.
-- Editing keeps the quantity immutable; deleting is an audited soft removal so
-- stock_movements can continue to reference the lot.

create or replace function public.update_stock_lot_record(
  p_lot_id uuid,
  p_lot_number text default null,
  p_received_at timestamptz default null,
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

  if company_id_value is null then
    raise exception 'Company workspace not found';
  end if;
  if p_expiry_notification_days is not null and p_expiry_notification_days < 0 then
    raise exception 'Notification days must be zero or greater';
  end if;
  if p_unit_cost is null or p_unit_cost < 0 then
    raise exception 'Unit cost must be zero or greater';
  end if;
  if p_supplier_id is null or not exists (
    select 1
      from public.suppliers s
     where s.id = p_supplier_id
       and s.company_id = company_id_value
  ) then
    raise exception 'A supplier from your company is required';
  end if;

  select *
    into lot_row
    from public.stock_lots
   where id = p_lot_id
     and company_id = company_id_value
   for update;

  if lot_row.id is null or not public.can_manage_location(lot_row.location_id) then
    raise exception 'Stock lot not found';
  end if;

  update public.stock_lots
     set lot_number = nullif(trim(p_lot_number), ''),
         received_at = coalesce(p_received_at, received_at),
         expiry_date = p_expiry_date,
         expiry_notification_days = p_expiry_notification_days,
         supplier_id = p_supplier_id,
         unit_cost = p_unit_cost,
         notes = nullif(trim(p_notes), ''),
         status = case
           when quantity_on_hand = 0 then 'depleted'::public.stock_lot_status
           when status in ('disposed', 'returned') then status
           else 'available'::public.stock_lot_status
         end,
         updated_at = now()
   where id = lot_row.id
  returning * into lot_row;

  return lot_row;
end;
$$;

revoke all on function public.update_stock_lot_record(uuid, text, timestamptz, timestamptz, integer, uuid, numeric, text) from public;
grant execute on function public.update_stock_lot_record(uuid, text, timestamptz, timestamptz, integer, uuid, numeric, text) to authenticated;

create or replace function public.delete_stock_lot(
  p_lot_id uuid,
  p_reason text default null
)
returns public.stock_lots
language plpgsql
security definer
set search_path = public
as $$
declare
  company_id_value uuid;
  lot_row public.stock_lots;
  old_quantity integer;
  reason_value text;
begin
  company_id_value := public.get_auth_company_id();
  reason_value := coalesce(nullif(trim(p_reason), ''), 'Stock lot removed');

  select *
    into lot_row
    from public.stock_lots
   where id = p_lot_id
     and company_id = company_id_value
   for update;

  if lot_row.id is null or not public.can_manage_location(lot_row.location_id) then
    raise exception 'Stock lot not found';
  end if;

  old_quantity := lot_row.quantity_on_hand;

  if old_quantity > 0 then
    insert into public.stock_movements (
      company_id,
      product_id,
      stock_lot_id,
      location_id,
      movement_type,
      quantity_delta,
      reason,
      created_by_auth_user_id
    ) values (
      lot_row.company_id,
      lot_row.product_id,
      lot_row.id,
      lot_row.location_id,
      'disposal',
      -old_quantity,
      reason_value,
      auth.uid()
    );
  end if;

  update public.stock_lots
     set quantity_on_hand = 0,
         status = 'disposed'::public.stock_lot_status,
         notes = reason_value,
         updated_at = now()
   where id = lot_row.id
  returning * into lot_row;

  return lot_row;
end;
$$;

revoke all on function public.delete_stock_lot(uuid, text) from public;
grant execute on function public.delete_stock_lot(uuid, text) to authenticated;
