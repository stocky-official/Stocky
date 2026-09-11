-- The notification model is item-level. Remove the temporary company/category
-- rule table introduced during the Alerts MVP experiment.

begin;

drop table if exists public.notification_rules;

commit;
