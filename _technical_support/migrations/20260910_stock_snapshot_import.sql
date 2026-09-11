-- Import a stock snapshot by barcode and keep quantity changes in the
-- append-only movement history. The browser sends actions through this
-- function instead of writing stock quantities directly.

create or replace function public.import_stock_snapshot(
  p_location_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  company_id_value uuid;
  row_value jsonb;
  product_row public.products;
  lot_row public.stock_lots;
  barcode_value text;
  name_value text;
  category_value text;
  unit_value text;
  lot_number_value text;
  quantity_value integer;
  reorder_point_value integer;
  alert_days_value integer;
  unit_cost_value numeric;
  expiry_value timestamptz;
  previous_quantity integer;
  quantity_delta integer;
  imported_count integer := 0;
  created_product_count integer := 0;
  updated_product_count integer := 0;
  created_lot_count integer := 0;
begin
  company_id_value := public.get_auth_company_id();
  if company_id_value is null then
    raise exception 'Company membership not found';
  end if;
  if not public.can_access_location(p_location_id) then
    raise exception 'You do not have access to this location';
  end if;
  if jsonb_typeof(coalesce(p_rows, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_rows, '[]'::jsonb)) = 0 then
    raise exception 'The import contains no rows';
  end if;
  if jsonb_array_length(p_rows) > 10000 then
    raise exception 'Imports are limited to 10,000 rows';
  end if;

  for row_value in select value from jsonb_array_elements(p_rows)
  loop
    barcode_value := nullif(trim(row_value->>'barcode'), '');
    name_value := nullif(trim(row_value->>'name'), '');
    if barcode_value is null then
      raise exception 'Every imported row needs a barcode';
    end if;
    if name_value is null then
      raise exception 'Every imported row needs a product name';
    end if;

    quantity_value := nullif(trim(row_value->>'quantity'), '')::integer;
    if quantity_value is null or quantity_value < 0 then
      raise exception 'Quantity must be a whole number of zero or greater';
    end if;

    category_value := nullif(trim(row_value->>'category_name'), '');
    unit_value := nullif(trim(row_value->>'unit_name'), '');
    lot_number_value := nullif(trim(row_value->>'lot_number'), '');
    reorder_point_value := nullif(trim(row_value->>'reorder_point'), '')::integer;
    if reorder_point_value is not null and reorder_point_value < 0 then
      raise exception 'Reorder point must be zero or greater';
    end if;
    alert_days_value := nullif(trim(row_value->>'expiry_notification_days'), '')::integer;
    if alert_days_value is not null and alert_days_value < 0 then
      raise exception 'Expiry notification days must be zero or greater';
    end if;
    unit_cost_value := nullif(trim(row_value->>'unit_cost'), '')::numeric;
    if unit_cost_value is not null and unit_cost_value < 0 then
      raise exception 'Unit cost must be zero or greater';
    end if;
    expiry_value := null;
    if nullif(trim(row_value->>'expiry_date'), '') is not null then
      expiry_value := (row_value->>'expiry_date')::timestamptz;
    end if;

    select * into product_row
      from public.products
     where company_id = company_id_value
       and barcode = barcode_value
     for update;

    if product_row.id is null then
      insert into public.products (
        company_id, name, barcode, category_name, unit_name,
        reorder_point, default_expiry_notification_days, unit_cost, is_active
      ) values (
        company_id_value, name_value, barcode_value, coalesce(category_value, 'General'), coalesce(unit_value, 'unit'),
        coalesce(reorder_point_value, 0), alert_days_value, coalesce(unit_cost_value, 0), true
      ) returning * into product_row;
      created_product_count := created_product_count + 1;
    else
      update public.products
         set name = name_value,
             category_name = coalesce(category_value, product_row.category_name),
             unit_name = coalesce(unit_value, product_row.unit_name),
             reorder_point = coalesce(reorder_point_value, product_row.reorder_point),
             default_expiry_notification_days = coalesce(alert_days_value, default_expiry_notification_days),
             unit_cost = coalesce(unit_cost_value, product_row.unit_cost),
             updated_at = now()
       where id = product_row.id
       returning * into product_row;
      updated_product_count := updated_product_count + 1;
    end if;

    select * into lot_row
      from public.stock_lots
     where company_id = company_id_value
       and location_id = p_location_id
       and product_id = product_row.id
       and coalesce(lot_number, '') = coalesce(lot_number_value, '')
       and expiry_date is not distinct from expiry_value
     order by received_at desc
     limit 1
     for update;

    if lot_row.id is null then
      insert into public.stock_lots (
        company_id, product_id, location_id, lot_number, expiry_date,
        expiry_notification_days, quantity_on_hand, unit_cost, status, notes
      ) values (
        company_id_value, product_row.id, p_location_id, lot_number_value, expiry_value,
        coalesce(alert_days_value, product_row.default_expiry_notification_days), quantity_value,
        coalesce(unit_cost_value, product_row.unit_cost, 0), case when quantity_value = 0 then 'depleted'::public.stock_lot_status else 'available'::public.stock_lot_status end,
        'Imported from a Stocky stock snapshot.'
      ) returning * into lot_row;
      previous_quantity := 0;
      created_lot_count := created_lot_count + 1;
    else
      previous_quantity := lot_row.quantity_on_hand;
      update public.stock_lots
         set quantity_on_hand = quantity_value,
             expiry_date = expiry_value,
             expiry_notification_days = coalesce(alert_days_value, expiry_notification_days, product_row.default_expiry_notification_days),
             unit_cost = coalesce(unit_cost_value, lot_row.unit_cost, product_row.unit_cost, 0),
             status = case when quantity_value = 0 then 'depleted'::public.stock_lot_status else 'available'::public.stock_lot_status end,
             updated_at = now()
       where id = lot_row.id
       returning * into lot_row;
    end if;

    quantity_delta := quantity_value - previous_quantity;
    if quantity_delta <> 0 then
      insert into public.stock_movements (
        company_id, product_id, stock_lot_id, location_id, movement_type,
        quantity_delta, reference_type, reason, created_by_auth_user_id
      ) values (
        company_id_value, product_row.id, lot_row.id, p_location_id, 'correction',
        quantity_delta, 'stock_import', 'Stock snapshot imported by barcode', auth.uid()
      );
    end if;
    imported_count := imported_count + 1;
  end loop;

  return jsonb_build_object(
    'importedCount', imported_count,
    'createdProductCount', created_product_count,
    'updatedProductCount', updated_product_count,
    'createdLotCount', created_lot_count
  );
end;
$$;

revoke all on function public.import_stock_snapshot(uuid, jsonb) from public;
grant execute on function public.import_stock_snapshot(uuid, jsonb) to authenticated;
