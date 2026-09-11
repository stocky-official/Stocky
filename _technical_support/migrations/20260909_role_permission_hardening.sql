-- Align server-side transfer request permissions with the role-aware UI.
-- Staff can receive and count stock, but only managers and company admins
-- can create transfer requests.

create or replace function public.create_stock_transfer_multi(
  p_source_location_id uuid,
  p_destination_location_id uuid,
  p_lines jsonb,
  p_note text default null
)
returns public.stock_transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  result_row public.stock_transfers;
  company_id_value uuid;
  company_user_id_value uuid;
  line jsonb;
  product_id_value uuid;
  quantity_value integer;
begin
  company_id_value := public.get_auth_company_id();

  if company_id_value is null
     or public.get_auth_user_role() not in ('owner', 'admin', 'manager') then
    raise exception 'Only managers and company administrators can request transfers';
  end if;

  if p_source_location_id = p_destination_location_id
     or jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) = 0 then
    raise exception 'Choose two locations and at least one product';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_lines) as duplicate_line
    group by duplicate_line->>'product_id'
    having count(*) > 1
  ) then
    raise exception 'Add each product only once to a transfer';
  end if;

  if not public.can_access_location(p_destination_location_id) then
    raise exception 'You do not have access to the destination location';
  end if;

  if not exists (
    select 1 from public.locations
    where id = p_source_location_id and company_id = company_id_value
  ) then
    raise exception 'Source location not found';
  end if;

  select id into company_user_id_value
  from public.company_users
  where company_id = company_id_value and auth_user_id = auth.uid()
  limit 1;

  insert into public.stock_transfers (
    company_id, source_location_id, destination_location_id,
    requested_by_company_user_id, note
  )
  values (
    company_id_value, p_source_location_id, p_destination_location_id,
    company_user_id_value, p_note
  )
  returning * into result_row;

  for line in select * from jsonb_array_elements(p_lines) loop
    product_id_value := (line->>'product_id')::uuid;
    quantity_value := (line->>'quantity')::integer;

    if quantity_value is null
       or quantity_value <= 0
       or not exists (
         select 1 from public.products
         where id = product_id_value and company_id = company_id_value
       ) then
      raise exception 'Each transfer line needs a valid product and positive quantity';
    end if;

    insert into public.stock_transfer_lines (
      transfer_id, product_id, quantity_requested
    ) values (result_row.id, product_id_value, quantity_value);
  end loop;

  return result_row;
end;
$$;

revoke all on function public.create_stock_transfer_multi(uuid, uuid, jsonb, text) from public;
grant execute on function public.create_stock_transfer_multi(uuid, uuid, jsonb, text) to authenticated;
