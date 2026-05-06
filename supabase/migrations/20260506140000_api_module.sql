-- =============================================
-- API MODULE
-- REST API key management + webhook configuration + delivery logs.
-- The API layer is served by the `store-api` Edge Function.
-- =============================================

-- ── 1. API keys ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                         -- human label
  key_hash      TEXT NOT NULL UNIQUE,                  -- SHA-256 of the raw key
  key_prefix    TEXT NOT NULL,                         -- first 8 chars shown in UI
  permissions   TEXT[] NOT NULL DEFAULT ARRAY['read'], -- 'read','write','webhooks'
  last_used_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_store    ON public.api_keys(store_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash     ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix   ON public.api_keys(key_prefix);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage api keys"
  ON public.api_keys FOR ALL
  USING (public.has_role(store_id, 'admin'))
  WITH CHECK (public.has_role(store_id, 'admin'));

-- ── 2. Webhooks ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  secret       TEXT NOT NULL,           -- HMAC secret for signature verification
  events       TEXT[] NOT NULL,         -- e.g. ['order.created','order.status_changed']
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_store  ON public.webhooks(store_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON public.webhooks USING GIN(events);

CREATE TRIGGER tr_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage webhooks"
  ON public.webhooks FOR ALL
  USING (public.has_role(store_id, 'admin'))
  WITH CHECK (public.has_role(store_id, 'admin'));

-- ── 3. Webhook delivery logs ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  webhook_id      UUID REFERENCES public.webhooks(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  status_code     INTEGER,
  response_body   TEXT,
  duration_ms     INTEGER,
  success         BOOLEAN NOT NULL DEFAULT false,
  error           TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wh_logs_store    ON public.webhook_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_wh_logs_webhook  ON public.webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_wh_logs_sent     ON public.webhook_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_wh_logs_success  ON public.webhook_logs(store_id, success);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read webhook logs"
  ON public.webhook_logs FOR SELECT
  USING (public.has_role(store_id, 'admin'));

-- Service role writes logs (no client INSERT)

-- ── 4. RPC: verify API key and return store_id (used by Edge Function) ────────

CREATE OR REPLACE FUNCTION public.verify_api_key(p_key_hash TEXT)
RETURNS TABLE (store_id UUID, permissions TEXT[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.api_keys
  SET last_used_at = now()
  WHERE key_hash = p_key_hash
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  RETURNING store_id, permissions;
$$;

GRANT EXECUTE ON FUNCTION public.verify_api_key TO service_role;
