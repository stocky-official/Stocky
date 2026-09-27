-- Link an invited company member to their Supabase Auth identity on first sign-in.
-- The function is intentionally scoped to the caller's verified auth email and
-- only claims an unbound invitation, so it cannot reassign an existing member.
create or replace function public.claim_company_membership()
returns table (
  company_id uuid,
  company_user_id uuid,
  membership_status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_email text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required to claim a company invitation';
  end if;

  select lower(trim(u.email))
    into current_user_email
  from auth.users u
  where u.id = current_user_id;

  if current_user_email is null or current_user_email = '' then
    raise exception 'A verified email is required to claim a company invitation';
  end if;

  return query
  update public.company_users cu
     set auth_user_id = current_user_id,
         status = 'active',
         updated_at = now()
   where cu.auth_user_id is null
     and cu.status = 'invited'
     and lower(trim(cu.email)) = current_user_email
  returning cu.company_id, cu.id, cu.status;
end;
$$;

revoke all on function public.claim_company_membership() from public;
grant execute on function public.claim_company_membership() to authenticated;
