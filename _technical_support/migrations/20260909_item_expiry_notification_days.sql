-- Each inventory item owns its own expiry notification window.
-- Existing items with an expiry date receive a compatibility value of 30 days;
-- users can change it per item from the inventory drawer.

begin;

alter table public.items
  add column if not exists expiry_notification_days integer;

update public.items
set expiry_notification_days = 30
where expiry_date is not null
  and expiry_notification_days is null;

alter table public.items
  drop constraint if exists items_expiry_notification_days_check;
alter table public.items
  drop constraint if exists items_expiry_notification_pair_check;

alter table public.items
  add constraint items_expiry_notification_days_check
  check (
    expiry_notification_days is null
    or expiry_notification_days between 0 and 3650
  ),
  add constraint items_expiry_notification_pair_check
  check (
    expiry_date is null
    or expiry_notification_days is not null
  );

create index if not exists items_expiry_notification_idx
  on public.items(company_id, expiry_date, expiry_notification_days);

commit;
