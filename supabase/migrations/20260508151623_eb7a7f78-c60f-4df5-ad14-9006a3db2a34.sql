
-- 1. Remove anonymous SELECT on customers (PII exposure). Server-side lookups use service role.
DROP POLICY IF EXISTS "Anon can read customers for embed lookup" ON public.customers;

-- 2. Prevent admins from deleting superadmin role rows
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete non-superadmin roles"
  ON public.user_roles FOR DELETE
  USING (
    has_role(store_id, 'admin'::app_role)
    AND role <> 'superadmin'::app_role
  );

-- 3. Hide cost_price from anonymous viewers (column-level grant).
REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (
  id, store_id, name, description, price, sku, stock,
  stock_alert_threshold, category, image_url, is_active,
  created_at, updated_at
) ON public.products TO anon;
