-- Stocky Platform Admin: Grant platform admins full storage access to company assets & logos
CREATE OR REPLACE FUNCTION public.can_access_company_storage(object_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $$
      SELECT public.is_stocky_platform_admin()
      OR exists (
        SELECT 1 FROM public.company_applications a
        WHERE (
          a.requested_by_auth_user_id = auth.uid()
          AND split_part(object_name, '/', 1) = auth.uid()::text
        )
        OR (
          a.company_id = public.get_auth_company_id()
          AND split_part(object_name, '/', 1) = a.requested_by_auth_user_id::text
        )
      )
      OR exists (
        SELECT 1 FROM public.company_users cu
        WHERE cu.auth_user_id = auth.uid()
          AND cu.company_id::text = split_part(object_name, '/', 1)
          AND cu.status = 'active'
      )
      OR exists (
        SELECT 1 FROM public.companies c
        WHERE c.id::text = split_part(object_name, '/', 1)
          AND c.id = public.get_auth_company_id()
      );
$$;
