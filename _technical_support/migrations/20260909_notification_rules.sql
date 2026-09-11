-- Persisted notification rules for product- and category-specific monitoring.
-- A NULL branch_id means a company-wide rule; managers must use a branch scope.

begin;

create table if not exists public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  item_id uuid references public.items(id) on delete cascade,
  category_name varchar(150),
  expiry_notify_days integer not null default 30,
  low_stock_threshold integer not null default 10,
  is_active boolean not null default true,
  created_by_auth_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_rules_scope_check
    check (num_nonnulls(item_id, category_name) = 1),
  constraint notification_rules_expiry_days_check
    check (expiry_notify_days between 0 and 3650),
  constraint notification_rules_low_stock_check
    check (low_stock_threshold between 0 and 100000)
);

create index if not exists notification_rules_company_idx
  on public.notification_rules(company_id, is_active);

create index if not exists notification_rules_branch_idx
  on public.notification_rules(company_id, branch_id, is_active);

create index if not exists notification_rules_item_idx
  on public.notification_rules(company_id, item_id, branch_id);

create index if not exists notification_rules_category_idx
  on public.notification_rules(company_id, category_name, branch_id);

alter table public.notification_rules enable row level security;

drop policy if exists notification_rules_select on public.notification_rules;
drop policy if exists notification_rules_write on public.notification_rules;

create policy notification_rules_select on public.notification_rules
for select to authenticated
using (
  company_id = public.get_auth_company_id()
  and (branch_id is null or public.can_access_branch(branch_id))
);

create policy notification_rules_write on public.notification_rules
for all to authenticated
using (
  company_id = public.get_auth_company_id()
  and (
    public.is_company_admin()
    or (
      public.get_auth_user_role() = 'manager'
      and branch_id is not null
      and public.can_access_branch(branch_id)
    )
  )
  and (
    branch_id is null
    or exists (
      select 1
      from public.branches b
      where b.id = notification_rules.branch_id
        and b.company_id = public.get_auth_company_id()
    )
  )
  and (
    item_id is null
    or exists (
      select 1
      from public.items i
      where i.id = notification_rules.item_id
        and i.company_id = public.get_auth_company_id()
  ))
)
with check (
  company_id = public.get_auth_company_id()
  and (
    public.is_company_admin()
    or (
      public.get_auth_user_role() = 'manager'
      and branch_id is not null
      and public.can_access_branch(branch_id)
    )
  )
  and (
    branch_id is null
    or exists (
      select 1
      from public.branches b
      where b.id = notification_rules.branch_id
        and b.company_id = public.get_auth_company_id()
    )
  )
  and (
    item_id is null
    or exists (
      select 1
      from public.items i
      where i.id = notification_rules.item_id
        and i.company_id = public.get_auth_company_id()
  ))
);

commit;
