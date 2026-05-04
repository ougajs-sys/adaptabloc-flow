-- 1. payment_status enum + column on orders
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending';

-- 2. shipping_city on customers (used by Segments page)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS shipping_city text;

-- 3. customer_segments table
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  name text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  customer_count integer NOT NULL DEFAULT 0,
  customer_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view segments" ON public.customer_segments;
CREATE POLICY "Members can view segments"
  ON public.customer_segments FOR SELECT
  USING (public.is_store_member(store_id));

DROP POLICY IF EXISTS "Members can create segments" ON public.customer_segments;
CREATE POLICY "Members can create segments"
  ON public.customer_segments FOR INSERT
  WITH CHECK (public.is_store_member(store_id));

DROP POLICY IF EXISTS "Members can update segments" ON public.customer_segments;
CREATE POLICY "Members can update segments"
  ON public.customer_segments FOR UPDATE
  USING (public.is_store_member(store_id));

DROP POLICY IF EXISTS "Admins can delete segments" ON public.customer_segments;
CREATE POLICY "Admins can delete segments"
  ON public.customer_segments FOR DELETE
  USING (public.has_role(store_id, 'admin'::app_role));

DROP TRIGGER IF EXISTS update_customer_segments_updated_at ON public.customer_segments;
CREATE TRIGGER update_customer_segments_updated_at
  BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Drop dead facebook_id column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS facebook_id;