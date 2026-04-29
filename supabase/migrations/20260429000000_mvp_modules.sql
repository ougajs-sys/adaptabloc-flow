-- ============================================================================
-- MVP Modules : stock movements, message templates, custom statuses, segments
-- ============================================================================

-- ── 1. Stock movements ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'sale', 'return')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_store ON public.stock_movements(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id, created_at DESC);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view stock_movements"
  ON public.stock_movements FOR SELECT
  USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can insert stock_movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'preparer')
    )
  );

-- ── 2. Message templates ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'whatsapp' CHECK (type IN ('sms', 'whatsapp', 'email')),
  content TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_store ON public.message_templates(store_id);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view message_templates"
  ON public.message_templates FOR SELECT
  USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage message_templates"
  ON public.message_templates FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 3. Custom order statuses ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_statuses_store ON public.order_statuses(store_id, sort_order);

ALTER TABLE public.order_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view order_statuses"
  ON public.order_statuses FOR SELECT
  USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage order_statuses"
  ON public.order_statuses FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add custom_label column to orders for custom status display
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS custom_label TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;

-- Auto-generate tracking token for new orders
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_token IS NULL THEN
    NEW.tracking_token := encode(gen_random_bytes(8), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_orders_tracking_token ON public.orders;
CREATE TRIGGER trg_orders_tracking_token
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_token();

-- Backfill existing orders with tracking tokens
UPDATE public.orders SET tracking_token = encode(gen_random_bytes(8), 'hex') WHERE tracking_token IS NULL;

-- ── 4. Customer segments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  customer_count INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_segments_store ON public.customer_segments(store_id);

ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view customer_segments"
  ON public.customer_segments FOR SELECT
  USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage customer_segments"
  ON public.customer_segments FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 5. Public order tracking access ─────────────────────────────────────────
-- Allow anonymous read of an order via tracking_token (no auth required)
CREATE POLICY "Public can read order via tracking_token"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (tracking_token IS NOT NULL);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_message_templates_updated ON public.message_templates;
CREATE TRIGGER trg_message_templates_updated BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customer_segments_updated ON public.customer_segments;
CREATE TRIGGER trg_customer_segments_updated BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
