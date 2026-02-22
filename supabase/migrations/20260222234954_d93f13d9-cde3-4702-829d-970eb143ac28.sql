
-- Superadmins need to read ALL stores, not just their own
CREATE POLICY "Superadmins can view all stores"
  ON public.stores FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

-- Superadmins can view all store_modules
CREATE POLICY "Superadmins can view all store_modules"
  ON public.store_modules FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

-- Superadmins can manage all store_modules
CREATE POLICY "Superadmins can manage store_modules"
  ON public.store_modules FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

-- Superadmins can update payment_providers
CREATE POLICY "Superadmins can update providers"
  ON public.payment_providers FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));
