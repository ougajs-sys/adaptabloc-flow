-- =============================================
-- AUTOMATIONS MODULE
-- Rule-based automation engine: When [trigger] → do [action].
-- Rules are stored here; execution is handled by the
-- process-automations edge function on DB events.
-- =============================================

-- ── 1. Trigger / action type enums ───────────────────────────────────────────

CREATE TYPE public.automation_trigger AS ENUM (
  'order_created',
  'order_confirmed',
  'order_delivered',
  'order_cancelled',
  'order_value_above',
  'order_not_confirmed_after',
  'delivery_assigned',
  'loyalty_tier_reached'
);

CREATE TYPE public.automation_action AS ENUM (
  'send_whatsapp_customer',
  'send_sms_customer',
  'notify_team',
  'update_order_status',
  'add_loyalty_points',
  'add_order_tag'
);

-- ── 2. Automation rules ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  trigger_type     public.automation_trigger NOT NULL,
  trigger_config   JSONB NOT NULL DEFAULT '{}',   -- e.g. {"min_amount": 50000}
  action_type      public.automation_action NOT NULL,
  action_config    JSONB NOT NULL DEFAULT '{}',   -- e.g. {"message": "Merci !"}
  is_active        BOOLEAN NOT NULL DEFAULT true,
  run_count        INTEGER NOT NULL DEFAULT 0,
  last_run_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_store
  ON public.automation_rules(store_id, is_active);

CREATE TRIGGER tr_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage automation rules"
  ON public.automation_rules FOR ALL
  USING (public.has_role(store_id, 'admin'))
  WITH CHECK (public.has_role(store_id, 'admin'));

-- ── 3. Automation execution log ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  rule_id      UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  order_id     UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status       TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  output       TEXT,                             -- result message or error detail
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_rule
  ON public.automation_logs(rule_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_store
  ON public.automation_logs(store_id, triggered_at DESC);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read automation logs"
  ON public.automation_logs FOR SELECT
  USING (public.has_role(store_id, 'admin'));

CREATE POLICY "Service role inserts logs"
  ON public.automation_logs FOR INSERT
  WITH CHECK (public.has_role(store_id, 'admin'));

-- ── 4. Automation stats view ──────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.automation_stats AS
SELECT
  r.store_id,
  COUNT(DISTINCT r.id)                                                         AS total_rules,
  COUNT(DISTINCT r.id) FILTER (WHERE r.is_active)                             AS active_rules,
  COUNT(l.id)                                                                  AS total_runs,
  COUNT(l.id) FILTER (WHERE l.status = 'success')                             AS successful_runs,
  COUNT(l.id) FILTER (WHERE l.triggered_at >= now() - INTERVAL '7 days')      AS runs_last_7d,
  SUM(r.run_count)                                                             AS total_executions
FROM public.automation_rules r
LEFT JOIN public.automation_logs l ON l.rule_id = r.id
GROUP BY r.store_id;

GRANT SELECT ON public.automation_stats TO authenticated;
