-- =============================================
-- CALL CENTER MODULE
-- Adds first-class call confirmation workflow:
--   - Reusable call scripts shown to callers
--   - Per-call attempt log with outcome tracking
--   - Performance view aggregating caller KPIs
-- =============================================

-- ── 1. Call scripts (reusable templates shown in caller workspace) ────────────

CREATE TABLE IF NOT EXISTS public.call_scripts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,        -- markdown / plain text
  language     TEXT NOT NULL DEFAULT 'fr',
  is_default   BOOLEAN NOT NULL DEFAULT false,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_scripts_store ON public.call_scripts(store_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_active ON public.call_scripts(store_id, is_active);

-- Only one default script per store
CREATE UNIQUE INDEX IF NOT EXISTS idx_call_scripts_one_default_per_store
  ON public.call_scripts(store_id) WHERE is_default = true;

CREATE TRIGGER tr_call_scripts_updated_at
  BEFORE UPDATE ON public.call_scripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.call_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read call scripts"
  ON public.call_scripts FOR SELECT
  USING (public.has_role(store_id, 'admin')
      OR public.has_role(store_id, 'caller'));

CREATE POLICY "Admins manage call scripts"
  ON public.call_scripts FOR ALL
  USING (public.has_role(store_id, 'admin'))
  WITH CHECK (public.has_role(store_id, 'admin'));

-- ── 2. Call outcomes enum ─────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_outcome') THEN
    CREATE TYPE call_outcome AS ENUM (
      'confirmed',     -- order confirmed
      'rejected',      -- customer cancelled
      'no_answer',     -- nobody picked up
      'busy',          -- line busy
      'wrong_number',  -- bad phone number
      'callback',      -- customer asked for a call back later
      'reschedule',    -- customer wants delivery rescheduled
      'voicemail'      -- voicemail left
    );
  END IF;
END$$;

-- ── 3. Call logs (one row per attempt) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.call_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id          UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  caller_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outcome           call_outcome NOT NULL,
  duration_seconds  INTEGER,                                  -- self-reported by caller
  notes             TEXT,
  callback_at       TIMESTAMPTZ,                              -- only set when outcome = 'callback'
  script_id         UUID REFERENCES public.call_scripts(id) ON DELETE SET NULL,
  called_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_store      ON public.call_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_order      ON public.call_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller     ON public.call_logs(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_called_at  ON public.call_logs(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_callback   ON public.call_logs(callback_at)
  WHERE outcome = 'callback' AND callback_at IS NOT NULL;

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members read call logs"
  ON public.call_logs FOR SELECT
  USING (public.has_role(store_id, 'admin')
      OR public.has_role(store_id, 'caller'));

CREATE POLICY "Callers and admins create call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK ((public.has_role(store_id, 'admin')
            OR public.has_role(store_id, 'caller'))
           AND caller_id = auth.uid());

CREATE POLICY "Admins update or delete call logs"
  ON public.call_logs FOR UPDATE
  USING (public.has_role(store_id, 'admin'));

CREATE POLICY "Admins delete call logs"
  ON public.call_logs FOR DELETE
  USING (public.has_role(store_id, 'admin'));

-- ── 4. Caller performance view ────────────────────────────────────────────────
-- Aggregates per-caller, per-store metrics. Cheap enough at SaaS scale; if it
-- becomes hot we can swap for a materialized view + refresh trigger.

CREATE OR REPLACE VIEW public.caller_performance AS
SELECT
  l.store_id,
  l.caller_id,
  COUNT(*)                                                                AS total_calls,
  COUNT(*) FILTER (WHERE l.outcome = 'confirmed')                         AS confirmed_count,
  COUNT(*) FILTER (WHERE l.outcome = 'rejected')                          AS rejected_count,
  COUNT(*) FILTER (WHERE l.outcome = 'no_answer')                         AS no_answer_count,
  COUNT(*) FILTER (WHERE l.outcome = 'callback')                          AS callback_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE l.outcome = 'confirmed')
          / NULLIF(COUNT(*), 0),
    2
  )                                                                       AS conversion_rate,
  ROUND(AVG(l.duration_seconds))                                          AS avg_duration_seconds,
  COUNT(*) FILTER (WHERE l.called_at >= now() - INTERVAL '7 days')        AS calls_last_7d,
  COUNT(*) FILTER (WHERE l.called_at >= now() - INTERVAL '24 hours')      AS calls_last_24h,
  MAX(l.called_at)                                                        AS last_call_at
FROM public.call_logs l
GROUP BY l.store_id, l.caller_id;

GRANT SELECT ON public.caller_performance TO authenticated;

-- ── 5. Trigger: auto-update order status on confirmed/rejected outcomes ───────
-- Keeps order pipeline coherent without forcing the client to issue two calls.

CREATE OR REPLACE FUNCTION public.fn_call_log_apply_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.outcome = 'confirmed' THEN
    UPDATE public.orders
       SET status = 'confirmed', updated_at = now()
     WHERE id = NEW.order_id
       AND status IN ('new', 'caller_pending', 'pending');
  ELSIF NEW.outcome = 'rejected' THEN
    UPDATE public.orders
       SET status = 'cancelled', updated_at = now()
     WHERE id = NEW.order_id
       AND status IN ('new', 'caller_pending', 'pending');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_call_log_apply_order_status ON public.call_logs;
CREATE TRIGGER tr_call_log_apply_order_status
  AFTER INSERT ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_call_log_apply_order_status();
