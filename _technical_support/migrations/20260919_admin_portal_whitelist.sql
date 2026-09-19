-- 20260919_admin_portal_whitelist.sql
-- Enforces single-email administrator access: abdelrahman.m.abualola@gmail.com

-- 1. Ensure abdelrahman.m.abualola@gmail.com is registered in public.platform_admins
insert into public.platform_admins (auth_user_id, email, is_active)
select id, email, true
from auth.users
where lower(email) = 'abdelrahman.m.abualola@gmail.com'
on conflict (auth_user_id) do update set is_active = true, email = excluded.email;

-- 2. Deactivate any other administrator accounts in public.platform_admins
update public.platform_admins
set is_active = false
where lower(email) <> 'abdelrahman.m.abualola@gmail.com';

-- 3. Harden is_stocky_platform_admin() function to strictly require email match
create or replace function public.is_stocky_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.platform_admins pa
    join auth.users u on u.id = pa.auth_user_id
    where pa.auth_user_id = auth.uid()
      and pa.is_active = true
      and lower(u.email) = 'abdelrahman.m.abualola@gmail.com'
  );
$$;

-- 4. Create secure RPC for admin platform overview statistics
create or replace function public.get_platform_admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result jsonb;
  total_companies_count int;
  verified_companies_count int;
  pending_companies_count int;
  rejected_companies_count int;
  total_users_count int;
  total_locations_count int;
  total_products_count int;
  total_lots_count int;
begin
  if not public.is_stocky_platform_admin() then
    raise exception 'Stocky platform administrator access is required';
  end if;

  select count(*) into total_companies_count from public.companies;
  select count(*) into verified_companies_count from public.companies where status = 'verified';
  select count(*) into pending_companies_count from public.company_applications where status = 'pending';
  select count(*) into rejected_companies_count from public.company_applications where status in ('rejected', 'withdrawn');
  select count(*) into total_users_count from public.company_users;
  select count(*) into total_locations_count from public.locations;
  select count(*) into total_products_count from public.products;
  select count(*) into total_lots_count from public.stock_lots;

  result := jsonb_build_object(
    'total_companies', total_companies_count,
    'verified_companies', verified_companies_count,
    'pending_companies', pending_companies_count,
    'rejected_companies', rejected_companies_count,
    'total_users', total_users_count,
    'total_locations', total_locations_count,
    'total_products', total_products_count,
    'total_lots', total_lots_count
  );

  return result;
end;
$$;
