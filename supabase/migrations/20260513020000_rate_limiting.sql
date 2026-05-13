-- =============================================
-- RATE LIMITING TABLE
-- Lightweight sliding-window hit counter used by
-- edge functions to enforce per-user/store request caps.
-- A nightly job or pg_cron should TRUNCATE old rows;
-- for now the index makes lookups fast even with growth.
-- =============================================

CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier  TEXT NOT NULL,        -- user_id or store_id
  endpoint    TEXT NOT NULL,        -- e.g. 'ai-chat', 'initiate-payment'
  hit_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_lookup
  ON public.rate_limit_hits(identifier, endpoint, hit_at DESC);

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write (edge functions use service_role key)
-- No policies needed — service_role bypasses RLS by default.

-- Auto-delete rows older than 24 hours to prevent unbounded growth
-- (requires pg_cron; if not available rows are cleaned on next window check)
CREATE OR REPLACE FUNCTION public.clean_old_rate_limit_hits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_hits WHERE hit_at < now() - INTERVAL '24 hours';
$$;
