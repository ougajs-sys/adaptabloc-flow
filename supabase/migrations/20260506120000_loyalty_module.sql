-- =============================================
-- LOYALTY MODULE
-- Points-based loyalty program with configurable tiers and rewards.
-- Customers earn points on orders; admins can configure tiers + redeem manually.
-- =============================================

-- ── 1. Program configuration (one row per store) ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.loyalty_config (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id               UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  points_per_1000_xof    INTEGER NOT NULL DEFAULT 10,   -- points earned per 1000 FCFA spent
  welcome_bonus          INTEGER NOT NULL DEFAULT 50,   -- points on first order
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_loyalty_config_updated_at
  BEFORE UPDATE ON public.loyalty_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.loyalty_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage loyalty config"
  ON public.loyalty_config FOR ALL
  USING (public.has_role(store_id, 'admin'))
  WITH CHECK (public.has_role(store_id, 'admin'));

CREATE POLICY "Members read loyalty config"
  ON public.loyalty_config FOR SELECT
  USING (public.has_role(store_id, 'admin')
      OR public.has_role(store_id, 'caller')
      OR public.has_role(store_id, 'preparer'));

-- ── 2. Tiers ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  min_points  INTEGER NOT NULL DEFAULT 0,
  color       TEXT NOT NULL DEFAULT '#6b7280',    -- hex color for UI badge
  benefits    TEXT,                               -- markdown description
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_store
  ON public.loyalty_tiers(store_id, min_points);

CREATE TRIGGER tr_loyalty_tiers_updated_at
  BEFORE UPDATE ON public.loyalty_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage loyalty tiers"
  ON public.loyalty_tiers FOR ALL
  USING (public.has_role(store_id, 'admin'))
  WITH CHECK (public.has_role(store_id, 'admin'));

CREATE POLICY "Members read loyalty tiers"
  ON public.loyalty_tiers FOR SELECT
  USING (public.has_role(store_id, 'admin')
      OR public.has_role(store_id, 'caller'));

-- ── 3. Point transactions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('earn','redeem','bonus','manual','expiry')),
  points      INTEGER NOT NULL,     -- positive = earn, negative = spend/redeem
  notes       TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_store      ON public.loyalty_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_customer   ON public.loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_order      ON public.loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_created    ON public.loyalty_transactions(created_at DESC);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage loyalty transactions"
  ON public.loyalty_transactions FOR ALL
  USING (public.has_role(store_id, 'admin'))
  WITH CHECK (public.has_role(store_id, 'admin'));

CREATE POLICY "Members read loyalty transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (public.has_role(store_id, 'admin')
      OR public.has_role(store_id, 'caller'));

-- ── 4. Customer balances view ─────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.loyalty_balances AS
SELECT
  t.store_id,
  t.customer_id,
  SUM(t.points) FILTER (WHERE t.points > 0)   AS total_earned,
  ABS(SUM(t.points) FILTER (WHERE t.points < 0)) AS total_redeemed,
  SUM(t.points)                                AS current_balance,
  COUNT(t.id) FILTER (WHERE t.type = 'earn')  AS total_orders_with_points,
  MAX(t.created_at)                            AS last_transaction_at
FROM public.loyalty_transactions t
GROUP BY t.store_id, t.customer_id;

GRANT SELECT ON public.loyalty_balances TO authenticated;

-- ── 5. RPC: award points for a completed order ────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_loyalty_award_order_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg RECORD;
  cust_id UUID;
  pts INTEGER;
  is_first BOOLEAN;
BEGIN
  -- Only fire when an order reaches 'delivered'
  IF NEW.status <> 'delivered' OR OLD.status = 'delivered' THEN
    RETURN NEW;
  END IF;

  -- Load loyalty config for this store
  SELECT * INTO cfg FROM public.loyalty_config
  WHERE store_id = NEW.store_id AND is_active = true
  LIMIT 1;

  IF cfg IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve customer_id from the order
  cust_id := NEW.customer_id;
  IF cust_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate points: X per 1000 FCFA
  pts := GREATEST(1, FLOOR(COALESCE(NEW.total, 0) / 1000.0 * cfg.points_per_1000_xof));

  INSERT INTO public.loyalty_transactions
    (store_id, customer_id, order_id, type, points, notes)
  VALUES
    (NEW.store_id, cust_id, NEW.id, 'earn', pts, 'Points sur commande livrée');

  -- Welcome bonus on first points ever
  SELECT NOT EXISTS (
    SELECT 1 FROM public.loyalty_transactions
    WHERE customer_id = cust_id AND store_id = NEW.store_id AND type = 'earn'
      AND order_id <> NEW.id
  ) INTO is_first;

  IF is_first AND cfg.welcome_bonus > 0 THEN
    INSERT INTO public.loyalty_transactions
      (store_id, customer_id, order_id, type, points, notes)
    VALUES
      (NEW.store_id, cust_id, NEW.id, 'bonus', cfg.welcome_bonus, 'Bonus de bienvenue');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_loyalty_award_order_points ON public.orders;
CREATE TRIGGER tr_loyalty_award_order_points
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.fn_loyalty_award_order_points();
