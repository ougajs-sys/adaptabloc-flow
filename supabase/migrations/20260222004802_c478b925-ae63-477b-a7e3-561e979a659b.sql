
-- Allow anonymous/public SELECT on embed_forms (only active forms, limited columns via app logic)
CREATE POLICY "Public can read active forms"
  ON public.embed_forms
  FOR SELECT
  TO anon
  USING (status = 'active');

-- Allow anonymous/public SELECT on products (only active products)
CREATE POLICY "Public can read active products"
  ON public.products
  FOR SELECT
  TO anon
  USING (is_active = true);
