-- Fix get_store_snapshot: column was o.total (wrong) — should be o.total_amount.
-- Also exclude cancelled/returned orders from revenue_today.

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
    COALESCE(SUM(o.total_amount) FILTER (
      WHERE o.created_at >= date_trunc('day', now())
        AND o.status NOT IN ('cancelled','returned')
    ), 0) AS revenue_today,
    (SELECT COUNT(*) FROM public.user_roles ur2 WHERE ur2.store_id = p_store_id) AS team_count
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND store_id = p_store_id AND role = 'admin'
    );
$$;
