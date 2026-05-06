-- =============================================
-- CHARIOW PAYMENT PROVIDER INTEGRATION
-- Adds Chariow as a payment provider with first-class license support.
-- Each successful Chariow checkout returns a license_key that we persist
-- on the subscription. Licenses can be re-validated periodically.
-- =============================================

-- ── 1. Register Chariow as a payment provider ─────────────────────────────────

INSERT INTO public.payment_providers
  (name, display_name, is_active, fee_percentage, markets, supported_methods)
VALUES (
  'chariow',
  'Chariow',
  true,
  2.50,
  -- West & Central Africa coverage (mobile money + cards)
  ARRAY['BJ','CI','SN','CM','BF','TG','ML','NE','GN','GW','GH','NG','RW','UG','TZ','KE','CD'],
  ARRAY['orange_money','wave','mtn_money','moov_money','card']
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_active    = EXCLUDED.is_active,
  fee_percentage = EXCLUDED.fee_percentage,
  markets      = EXCLUDED.markets,
  supported_methods = EXCLUDED.supported_methods,
  updated_at   = now();

-- ── 2. Extend subscriptions with license fields ───────────────────────────────

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS chariow_license_key        TEXT,
  ADD COLUMN IF NOT EXISTS chariow_product_id         TEXT,
  ADD COLUMN IF NOT EXISTS chariow_machine_identifier TEXT,
  ADD COLUMN IF NOT EXISTS chariow_activated_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS chariow_last_validated_at  TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_chariow_license
  ON public.subscriptions(chariow_license_key)
  WHERE chariow_license_key IS NOT NULL;

-- ── 3. Map a module bundle to a Chariow product ID ────────────────────────────
-- Lets admins configure: "module 'campaigns' is sold via Chariow product abc-123".
-- The bundle_key is a stable hash/string the app uses to look up the product.

CREATE TABLE IF NOT EXISTS public.chariow_product_mapping (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_key         TEXT NOT NULL UNIQUE,           -- e.g. "single:campaigns" or "bundle:starter"
  chariow_product_id TEXT NOT NULL,
  display_name       TEXT,
  description        TEXT,
  modules            TEXT[] NOT NULL DEFAULT '{}',   -- which intramate modules this unlocks
  amount_xof         INTEGER,                        -- expected price (sanity check)
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chariow_mapping_product
  ON public.chariow_product_mapping(chariow_product_id);

CREATE TRIGGER tr_chariow_product_mapping_updated_at
  BEFORE UPDATE ON public.chariow_product_mapping
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.chariow_product_mapping ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read mappings (needed at checkout time)
CREATE POLICY "Authenticated can read chariow mappings"
  ON public.chariow_product_mapping FOR SELECT
  TO authenticated
  USING (true);

-- Only superadmins manage mappings
CREATE POLICY "Superadmins manage chariow mappings"
  ON public.chariow_product_mapping FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- ── 4. Webhook event log (idempotency + debugging) ────────────────────────────

CREATE TABLE IF NOT EXISTS public.chariow_webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        TEXT NOT NULL UNIQUE,    -- Chariow event ID (idempotency key)
  event_type      TEXT NOT NULL,           -- 'sale.completed', 'license.activated', etc.
  payload         JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  processed_at    TIMESTAMPTZ,
  error           TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chariow_events_type
  ON public.chariow_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_chariow_events_received
  ON public.chariow_webhook_events(received_at DESC);

ALTER TABLE public.chariow_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read webhook events (sensitive data)
CREATE POLICY "Superadmins read chariow webhook events"
  ON public.chariow_webhook_events FOR SELECT
  USING (public.is_superadmin());

-- ── 5. License activation history (per-machine activations) ───────────────────

CREATE TABLE IF NOT EXISTS public.chariow_license_activations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id      UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  store_id             UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  license_key          TEXT NOT NULL,
  machine_identifier   TEXT NOT NULL,
  user_agent           TEXT,
  ip_hash              TEXT,                      -- hash, not raw IP, for privacy
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  activated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at           TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_license_activation_unique
  ON public.chariow_license_activations(license_key, machine_identifier);
CREATE INDEX IF NOT EXISTS idx_license_activation_store
  ON public.chariow_license_activations(store_id);

ALTER TABLE public.chariow_license_activations ENABLE ROW LEVEL SECURITY;

-- Store admins can view their own license activations
CREATE POLICY "Admins view their license activations"
  ON public.chariow_license_activations FOR SELECT
  USING (public.has_role(store_id, 'admin'));

-- Only the service role / functions write activations (no client-side INSERT)

-- ── 6. RPC: get current Chariow license for a store ───────────────────────────

CREATE OR REPLACE FUNCTION public.get_chariow_license(p_store_id UUID)
RETURNS TABLE (
  license_key TEXT,
  product_id  TEXT,
  status      TEXT,
  activated_at TIMESTAMPTZ,
  last_validated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    chariow_license_key,
    chariow_product_id,
    status,
    chariow_activated_at,
    chariow_last_validated_at
  FROM public.subscriptions
  WHERE store_id = p_store_id
    AND chariow_license_key IS NOT NULL
  ORDER BY chariow_activated_at DESC NULLS LAST
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_chariow_license TO authenticated;
