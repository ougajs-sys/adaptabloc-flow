-- =============================================
-- MULTI-STORE MODULE
-- Lets a single admin user own and switch between multiple stores.
-- Relies on the existing user_roles table (one row per store+role).
-- =============================================

-- ── 1. Store switch preference (one row per user) ─────────────────────────────
-- Persists which store the user last switched to. buildAppUser reads this
-- first, falling back to user_roles[0] if absent.

CREATE TABLE IF NOT EXISTS public.user_store_preferences (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_store_id  UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_store_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own store preference"
  ON public.user_store_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 2. RPC: list all stores where the caller is admin ─────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_stores()
RETURNS TABLE (
  store_id    UUID,
  store_name  TEXT,
  store_slug  TEXT,
  is_active   BOOLEAN,
  joined_at   TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id         AS store_id,
    s.name       AS store_name,
    s.slug       AS store_slug,
    s.is_active,
    ur.created_at AS joined_at
  FROM public.user_roles ur
  JOIN public.stores s ON s.id = ur.store_id
  WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  ORDER BY ur.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_stores TO authenticated;

-- ── 3. RPC: switch active store ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.switch_active_store(p_store_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND store_id = p_store_id
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: not an admin of this store';
  END IF;

  INSERT INTO public.user_store_preferences (user_id, preferred_store_id, updated_at)
  VALUES (auth.uid(), p_store_id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET preferred_store_id = EXCLUDED.preferred_store_id,
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.switch_active_store TO authenticated;

-- ── 4. RPC: per-store snapshot (cross-store KPIs) ─────────────────────────────

CREATE OR REPLACE FUNCTION public.get_store_snapshot(p_store_id UUID)
RETURNS TABLE (
  orders_today    BIGINT,
  orders_pending  BIGINT,
  revenue_today   NUMERIC,
  team_count      BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE o.created_at >= date_trunc('day', now()))         AS orders_today,
    COUNT(*) FILTER (WHERE o.status IN ('new','caller_pending','confirmed','preparing','ready')) AS orders_pending,
    COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= date_trunc('day', now())), 0) AS revenue_today,
    (SELECT COUNT(*) FROM public.user_roles ur2 WHERE ur2.store_id = p_store_id) AS team_count
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND store_id = p_store_id AND role = 'admin'
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_store_snapshot TO authenticated;
