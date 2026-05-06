-- =============================================
-- WAREHOUSE TEAM MODULE
-- Unlocks unlimited preparers + warehouse post management
-- + per-preparer productivity tracking.
-- =============================================

-- ── 1. Warehouse posts / stations ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.warehouse_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_posts_store
  ON public.warehouse_posts(store_id);

CREATE TRIGGER tr_warehouse_posts_updated_at
  BEFORE UPDATE ON public.warehouse_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.warehouse_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members read warehouse posts"
  ON public.warehouse_posts FOR SELECT
  USING (public.has_role(store_id, 'admin')
      OR public.has_role(store_id, 'preparer'));

CREATE POLICY "Admins manage warehouse posts"
  ON public.warehouse_posts FOR ALL
  USING (public.has_role(store_id, 'admin'))
  WITH CHECK (public.has_role(store_id, 'admin'));

-- ── 2. Preparation logs (one row per completed preparation) ───────────────────

CREATE TABLE IF NOT EXISTS public.preparation_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id          UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  preparer_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id           UUID REFERENCES public.warehouse_posts(id) ON DELETE SET NULL,
  duration_seconds  INTEGER,
  notes             TEXT,
  items_count       INTEGER,                  -- snapshot at prep time
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prep_logs_store      ON public.preparation_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_prep_logs_order      ON public.preparation_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_prep_logs_preparer   ON public.preparation_logs(preparer_id);
CREATE INDEX IF NOT EXISTS idx_prep_logs_completed  ON public.preparation_logs(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_prep_logs_post       ON public.preparation_logs(post_id);

ALTER TABLE public.preparation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members read prep logs"
  ON public.preparation_logs FOR SELECT
  USING (public.has_role(store_id, 'admin')
      OR public.has_role(store_id, 'preparer'));

CREATE POLICY "Preparers and admins create prep logs"
  ON public.preparation_logs FOR INSERT
  WITH CHECK ((public.has_role(store_id, 'admin')
            OR public.has_role(store_id, 'preparer'))
           AND preparer_id = auth.uid());

CREATE POLICY "Admins update or delete prep logs"
  ON public.preparation_logs FOR ALL
  USING (public.has_role(store_id, 'admin'));

-- ── 3. Preparer performance view ──────────────────────────────────────────────

CREATE OR REPLACE VIEW public.preparer_performance AS
SELECT
  l.store_id,
  l.preparer_id,
  COUNT(*)                                                                  AS total_prepared,
  ROUND(AVG(l.duration_seconds))                                            AS avg_duration_seconds,
  ROUND(AVG(l.items_count))                                                 AS avg_items_per_order,
  COUNT(*) FILTER (WHERE l.completed_at >= now() - INTERVAL '24 hours')    AS prepared_last_24h,
  COUNT(*) FILTER (WHERE l.completed_at >= now() - INTERVAL '7 days')      AS prepared_last_7d,
  MAX(l.completed_at)                                                       AS last_completed_at
FROM public.preparation_logs l
GROUP BY l.store_id, l.preparer_id;

GRANT SELECT ON public.preparer_performance TO authenticated;
