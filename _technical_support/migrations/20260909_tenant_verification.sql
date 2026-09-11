-- Stocky tenant verification foundation.
-- Review and run this through the Supabase migration workflow.
-- This migration is intentionally not executed by the application.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'company_status') then
    create type public.company_status as enum ('pending', 'verified', 'rejected', 'suspended');
  end if;

  if not exists (select 1 from pg_type where typname = 'company_application_status') then
    create type public.company_application_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
  end if;
end
$$;

alter table public.companies
  add column if not exists status public.company_status,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by_auth_user_id uuid,
  add column if not exists verification_note text;

-- Existing seeded companies are treated as legacy verified tenants. New rows
-- use pending until a Stocky platform administrator approves them.
update public.companies
set status = 'verified'::public.company_status,
    verified_at = coalesce(verified_at, now())
where status is null;

alter table public.companies
  alter column status set default 'pending'::public.company_status,
  alter column status set not null;

create table if not exists public.platform_admins (
  auth_user_id uuid primary key,
  email varchar(255) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.company_applications (
  id uuid primary key default gen_random_uuid(),
  requested_by_auth_user_id uuid not null,
  requested_email varchar(255) not null,
  company_id uuid references public.companies(id) on delete set null,
  company_name varchar(255) not null,
  company_code varchar(50),
  logo_path text,
  initial_branch_name varchar(255),
  status public.company_application_status not null default 'pending',
  reviewed_by_auth_user_id uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_applications_requester_idx
  on public.company_applications(requested_by_auth_user_id, created_at desc);

create index if not exists company_applications_status_idx
  on public.company_applications(status, created_at desc);

create or replace function public.is_stocky_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where auth_user_id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.get_auth_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cu.company_id
  from public.company_users cu
  join public.companies c on c.id = cu.company_id
  where cu.auth_user_id = auth.uid()
    and cu.status = 'active'
    and c.status = 'verified'::public.company_status
  limit 1;
$$;

create or replace function public.get_auth_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select cu.role::text
  from public.company_users cu
  join public.companies c on c.id = cu.company_id
  where cu.auth_user_id = auth.uid()
    and cu.status = 'active'
    and c.status = 'verified'::public.company_status
  limit 1;
$$;

create or replace function public.get_auth_user_branch_ids()
returns table(branch_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select ub.branch_id
  from public.user_branches ub
  join public.company_users cu on cu.id = ub.user_id
  where cu.auth_user_id = auth.uid()
    and cu.status = 'active';
$$;

create or replace function public.is_company_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_auth_user_role() in ('owner', 'admin');
$$;

create or replace function public.can_access_branch(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.branches b
    where b.id = target_branch_id
      and b.company_id = public.get_auth_company_id()
      and (
        public.get_auth_user_role() in ('owner', 'admin')
        or b.id in (select branch_id from public.get_auth_user_branch_ids())
      )
  );
$$;

create or replace function public.submit_company_application(
  application_id uuid,
  requested_company_name text,
  requested_company_code text,
  requested_logo_path text,
  requested_initial_branch_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requester_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if nullif(trim(requested_company_name), '') is null then
    raise exception 'Company name is required';
  end if;

  if requested_logo_path is not null
     and split_part(trim(requested_logo_path), '/', 1) <> auth.uid()::text then
    raise exception 'Logo path is outside the applicant namespace';
  end if;

  select email into requester_email from auth.users where id = auth.uid();

  if exists (
    select 1 from public.company_applications
    where requested_by_auth_user_id = auth.uid()
      and status = 'pending'::public.company_application_status
  ) then
    raise exception 'A company application is already pending';
  end if;

  insert into public.company_applications (
    id,
    requested_by_auth_user_id,
    requested_email,
    company_name,
    company_code,
    logo_path,
    initial_branch_name
  ) values (
    application_id,
    auth.uid(),
    coalesce(requester_email, ''),
    trim(requested_company_name),
    nullif(trim(requested_company_code), ''),
    nullif(trim(requested_logo_path), ''),
    nullif(trim(requested_initial_branch_name), '')
  );

  return application_id;
end;
$$;

create or replace function public.set_company_application_logo(
  p_application_id uuid,
  p_logo_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or nullif(trim(p_logo_path), '') is null
     or split_part(trim(p_logo_path), '/', 1) <> auth.uid()::text then
    raise exception 'Logo path is outside the applicant namespace';
  end if;

  update public.company_applications
  set logo_path = nullif(trim(p_logo_path), ''),
      updated_at = now()
  where id = p_application_id
    and requested_by_auth_user_id = auth.uid()
    and status = 'pending'::public.company_application_status;

  if not found then
    raise exception 'Pending company application not found';
  end if;
end;
$$;

create or replace function public.approve_company_application(
  p_application_id uuid,
  p_review_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  application_row public.company_applications%rowtype;
  created_company_id uuid;
  created_branch_id uuid;
  created_user_id uuid;
begin
  if not public.is_stocky_platform_admin() then
    raise exception 'Stocky platform administrator access is required';
  end if;

  select * into application_row
  from public.company_applications
  where id = p_application_id
  for update;

  if application_row.id is null then
    raise exception 'Company application not found';
  end if;

  if application_row.status <> 'pending'::public.company_application_status then
    raise exception 'Only pending company applications can be approved';
  end if;

  insert into public.companies (
    name,
    code,
    logo_url,
    status,
    verified_at,
    verified_by_auth_user_id,
    verification_note
  ) values (
    application_row.company_name,
    application_row.company_code,
    application_row.logo_path,
    'verified'::public.company_status,
    now(),
    auth.uid(),
    p_review_note
  ) returning id into created_company_id;

  insert into public.branches (company_id, name, code, is_active)
  values (
    created_company_id,
    coalesce(application_row.initial_branch_name, 'Main Branch'),
    'BR-01',
    true
  ) returning id into created_branch_id;

  insert into public.company_users (
    auth_user_id,
    company_id,
    email,
    role,
    can_edit,
    can_delete,
    status
  ) values (
    application_row.requested_by_auth_user_id,
    created_company_id,
    application_row.requested_email,
    'owner',
    true,
    true,
    'active'
  ) returning id into created_user_id;

  insert into public.user_branches (user_id, branch_id)
  values (created_user_id, created_branch_id);

  update public.company_applications
  set company_id = created_company_id,
      status = 'approved'::public.company_application_status,
      reviewed_by_auth_user_id = auth.uid(),
      reviewed_at = now(),
      review_note = p_review_note,
      updated_at = now()
  where id = p_application_id;

  return created_company_id;
end;
$$;

create or replace function public.reject_company_application(
  p_application_id uuid,
  p_review_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_stocky_platform_admin() then
    raise exception 'Stocky platform administrator access is required';
  end if;

  update public.company_applications
  set status = 'rejected'::public.company_application_status,
      reviewed_by_auth_user_id = auth.uid(),
      reviewed_at = now(),
      review_note = p_review_note,
      updated_at = now()
  where id = p_application_id
    and status = 'pending'::public.company_application_status;

  if not found then
    raise exception 'Pending company application not found';
  end if;
end;
$$;

-- The old triggers and scripts created default-company memberships. New users
-- are left unassigned until an application is approved. Existing invitations
-- are still claimed when the invited email authenticates.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.company_users
  set auth_user_id = new.id,
      status = 'active',
      full_name = coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', full_name),
      avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', avatar_url),
      updated_at = now()
  where lower(email) = lower(new.email)
    and status = 'invited'
    and auth_user_id is null;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute function public.handle_new_user();

-- Remove every existing public policy on the tenant tables. This is required
-- because the MVP scripts created permissive USING (true) policies.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'companies', 'company_applications', 'platform_admins', 'company_users',
        'user_branches', 'branches', 'categories', 'items', 'suppliers',
        'supplier_items', 'alerts'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end
$$;

alter table public.companies enable row level security;
alter table public.company_applications enable row level security;
alter table public.platform_admins enable row level security;
alter table public.company_users enable row level security;
alter table public.user_branches enable row level security;
alter table public.branches enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_items enable row level security;
alter table public.alerts enable row level security;

create policy company_applications_select on public.company_applications
for select to authenticated
using (requested_by_auth_user_id = auth.uid() or public.is_stocky_platform_admin());

create policy company_applications_insert on public.company_applications
for insert to authenticated
with check (
  requested_by_auth_user_id = auth.uid()
  and status = 'pending'::public.company_application_status
  and company_id is null
  and reviewed_by_auth_user_id is null
  and reviewed_at is null
);

create policy platform_admins_select on public.platform_admins
for select to authenticated
using (auth_user_id = auth.uid());

create policy companies_select on public.companies
for select to authenticated
using (id = public.get_auth_company_id() or public.is_stocky_platform_admin());

create policy companies_update on public.companies
for update to authenticated
using (id = public.get_auth_company_id() and public.is_company_admin())
with check (id = public.get_auth_company_id() and public.is_company_admin());

create policy company_users_select on public.company_users
for select to authenticated
using (company_id = public.get_auth_company_id() or public.is_stocky_platform_admin());

create policy company_users_insert on public.company_users
for insert to authenticated
with check (company_id = public.get_auth_company_id() and public.is_company_admin());

create policy company_users_update on public.company_users
for update to authenticated
using (company_id = public.get_auth_company_id() and public.is_company_admin())
with check (company_id = public.get_auth_company_id() and public.is_company_admin());

create policy company_users_delete on public.company_users
for delete to authenticated
using (company_id = public.get_auth_company_id() and public.is_company_admin());

create policy user_branches_select on public.user_branches
for select to authenticated
using (
  public.is_stocky_platform_admin()
  or exists (
    select 1
    from public.company_users cu
    join public.branches b on b.company_id = cu.company_id
    where cu.id = user_branches.user_id
      and b.id = user_branches.branch_id
      and cu.company_id = public.get_auth_company_id()
  )
);

create policy user_branches_write on public.user_branches
for all to authenticated
using (
  public.is_company_admin()
  and exists (
    select 1
    from public.company_users cu
    join public.branches b on b.company_id = cu.company_id
    where cu.id = user_branches.user_id
      and b.id = user_branches.branch_id
      and cu.company_id = public.get_auth_company_id()
  )
)
with check (
  public.is_company_admin()
  and exists (
    select 1
    from public.company_users cu
    join public.branches b on b.company_id = cu.company_id
    where cu.id = user_branches.user_id
      and b.id = user_branches.branch_id
      and cu.company_id = public.get_auth_company_id()
  )
);

create policy branches_select on public.branches
for select to authenticated
using (public.can_access_branch(id));

create policy branches_write on public.branches
for all to authenticated
using (company_id = public.get_auth_company_id() and public.is_company_admin())
with check (company_id = public.get_auth_company_id() and public.is_company_admin());

create policy categories_select on public.categories
for select to authenticated
using (company_id = public.get_auth_company_id());

create policy categories_write on public.categories
for all to authenticated
using (company_id = public.get_auth_company_id() and public.is_company_admin())
with check (company_id = public.get_auth_company_id() and public.is_company_admin());

create policy items_select on public.items
for select to authenticated
using (company_id = public.get_auth_company_id() and public.can_access_branch(branch_id));

create policy items_insert on public.items
for insert to authenticated
with check (
  company_id = public.get_auth_company_id()
  and public.can_access_branch(branch_id)
  and (public.is_company_admin() or public.get_auth_user_role() = 'manager')
);

create policy items_update on public.items
for update to authenticated
using (
  company_id = public.get_auth_company_id()
  and public.can_access_branch(branch_id)
  and (public.is_company_admin() or public.get_auth_user_role() = 'manager')
)
with check (
  company_id = public.get_auth_company_id()
  and public.can_access_branch(branch_id)
  and (public.is_company_admin() or public.get_auth_user_role() = 'manager')
);

create policy suppliers_select on public.suppliers
for select to authenticated
using (company_id = public.get_auth_company_id());

create policy suppliers_write on public.suppliers
for all to authenticated
using (company_id = public.get_auth_company_id() and public.is_company_admin())
with check (company_id = public.get_auth_company_id() and public.is_company_admin());

create policy supplier_items_select on public.supplier_items
for select to authenticated
using (exists (
  select 1 from public.suppliers s
  where s.id = supplier_items.supplier_id
    and s.company_id = public.get_auth_company_id()
));

create policy supplier_items_write on public.supplier_items
for all to authenticated
using (
  public.is_company_admin()
  and exists (
    select 1 from public.suppliers s
    where s.id = supplier_items.supplier_id
      and s.company_id = public.get_auth_company_id()
  )
)
with check (
  public.is_company_admin()
  and exists (
    select 1 from public.suppliers s
    where s.id = supplier_items.supplier_id
      and s.company_id = public.get_auth_company_id()
  )
);

create policy alerts_select on public.alerts
for select to authenticated
using (
  company_id = public.get_auth_company_id()
  and (branch_id is null or public.can_access_branch(branch_id))
  and (
    item_id is null
    or exists (
      select 1 from public.items i
      where i.id = alerts.item_id
        and i.company_id = public.get_auth_company_id()
    )
  )
);

create policy alerts_write on public.alerts
for all to authenticated
using (
  company_id = public.get_auth_company_id()
  and (branch_id is null or public.can_access_branch(branch_id))
  and (
    item_id is null
    or exists (
      select 1 from public.items i
      where i.id = alerts.item_id
        and i.company_id = public.get_auth_company_id()
    )
  )
  and (public.is_company_admin() or public.get_auth_user_role() = 'manager')
)
with check (
  company_id = public.get_auth_company_id()
  and (branch_id is null or public.can_access_branch(branch_id))
  and (
    item_id is null
    or exists (
      select 1 from public.items i
      where i.id = alerts.item_id
        and i.company_id = public.get_auth_company_id()
    )
  )
  and (public.is_company_admin() or public.get_auth_user_role() = 'manager')
);

-- Replace the public storage policies created by the MVP onboarding script.
insert into storage.buckets (id, name, public)
values ('stocky-private', 'stocky-private', false)
on conflict (id) do update
set public = false;

drop policy if exists stocky_private_allow_insert on storage.objects;
drop policy if exists stocky_private_allow_select on storage.objects;
drop policy if exists stocky_private_allow_update on storage.objects;
drop policy if exists stocky_private_allow_delete on storage.objects;

create or replace function public.can_access_company_storage(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_applications a
    where (
      a.requested_by_auth_user_id = auth.uid()
      and split_part(object_name, '/', 1) = auth.uid()::text
    )
    or (
      a.company_id = public.get_auth_company_id()
      and split_part(object_name, '/', 1) = a.requested_by_auth_user_id::text
    )
  )
  or exists (
    select 1 from public.companies c
    where c.id::text = split_part(object_name, '/', 1)
      and c.id = public.get_auth_company_id()
  );
$$;

create policy stocky_private_scoped_select on storage.objects
for select to authenticated
using (bucket_id = 'stocky-private' and public.can_access_company_storage(name));

create policy stocky_private_scoped_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'stocky-private' and public.can_access_company_storage(name));

create policy stocky_private_scoped_update on storage.objects
for update to authenticated
using (bucket_id = 'stocky-private' and public.can_access_company_storage(name))
with check (bucket_id = 'stocky-private' and public.can_access_company_storage(name));

create policy stocky_private_scoped_delete on storage.objects
for delete to authenticated
using (bucket_id = 'stocky-private' and public.can_access_company_storage(name));

commit;
