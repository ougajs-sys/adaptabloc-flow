
-- 1. Restrict payment_providers SELECT to superadmins only (api_key/secret_key were exposed to all authenticated users)
DROP POLICY IF EXISTS "Authenticated can view active providers" ON public.payment_providers;

-- 2. Prevent privilege escalation: store admins cannot insert/update 'superadmin' role
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

CREATE POLICY "Admins can insert non-superadmin roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    has_role(store_id, 'admin'::app_role)
    AND role <> 'superadmin'::app_role
  );

CREATE POLICY "Admins can update non-superadmin roles"
  ON public.user_roles FOR UPDATE
  USING (
    has_role(store_id, 'admin'::app_role)
    AND role <> 'superadmin'::app_role
  )
  WITH CHECK (
    has_role(store_id, 'admin'::app_role)
    AND role <> 'superadmin'::app_role
  );

-- 3. Lock down product-images bucket: only members of the store owning the path can write/delete
DROP POLICY IF EXISTS "Store admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Store admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Store admins can delete product images" ON storage.objects;

CREATE POLICY "Store members can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Store members can update own product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Store members can delete own product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND public.is_store_member(((storage.foldername(name))[1])::uuid)
  );
