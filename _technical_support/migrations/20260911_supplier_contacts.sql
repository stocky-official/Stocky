create table if not exists public.supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  name varchar(255) not null,
  role varchar(150),
  phone varchar(50) not null,
  email varchar(255),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_contacts_supplier_id_idx
  on public.supplier_contacts(supplier_id);

create unique index if not exists supplier_contacts_one_primary_idx
  on public.supplier_contacts(supplier_id)
  where is_primary = true;

insert into public.supplier_contacts (company_id, supplier_id, name, phone, email, is_primary)
select s.company_id, s.id, s.contact_name, s.contact_phone, s.contact_email, true
from public.suppliers s
where not exists (
  select 1 from public.supplier_contacts c where c.supplier_id = s.id
);

alter table public.supplier_contacts enable row level security;

drop policy if exists supplier_contacts_select on public.supplier_contacts;
create policy supplier_contacts_select on public.supplier_contacts
for select to authenticated
using (company_id = public.get_auth_company_id());

drop policy if exists supplier_contacts_write on public.supplier_contacts;
create policy supplier_contacts_write on public.supplier_contacts
for all to authenticated
using (
  company_id = public.get_auth_company_id()
  and public.is_company_admin()
)
with check (
  company_id = public.get_auth_company_id()
  and public.is_company_admin()
  and exists (
    select 1 from public.suppliers s
    where s.id = supplier_contacts.supplier_id
      and s.company_id = public.get_auth_company_id()
  )
);
