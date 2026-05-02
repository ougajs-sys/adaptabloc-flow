-- =============================================
-- Security & business-logic fixes
-- =============================================

-- ── 1. Tracking token: 8 bytes (64-bit) → 16 bytes (128-bit) ────────────────
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tracking_token IS NULL THEN
    NEW.tracking_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill existing short tokens (16 hex chars = 8 bytes → replace with 32 hex chars = 16 bytes)
UPDATE public.orders
SET tracking_token = encode(gen_random_bytes(16), 'hex')
WHERE tracking_token IS NOT NULL AND length(tracking_token) < 32;

-- ── 2. Remove overly broad anon SELECT * on customers ───────────────────────
-- The submit-form edge function already uses service_role to look up customers.
-- There is no legitimate reason for the anon role to SELECT all customer rows
-- of a store. The only INSERT policy is sufficient for the embed flow.
DROP POLICY IF EXISTS "Anon can read customers for embed lookup" ON public.customers;

-- ── 3. Team invitation expiry ───────────────────────────────────────────────
ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
    DEFAULT (now() + INTERVAL '7 days');

-- Backfill: give existing pending invitations a 7-day window from creation
UPDATE public.team_invitations
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL AND status = 'pending';

-- ── 4. Stock auto-restoration on order cancellation / return ────────────────
-- When an order transitions to 'cancelled' or 'returned', add back the
-- reserved quantities into products.stock (not stock_movements, just stock).
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancellation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'returned')
     AND OLD.status NOT IN ('cancelled', 'returned') THEN

    UPDATE public.products p
    SET stock = p.stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id
      AND p.store_id = NEW.store_id;

  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restore_stock_on_cancel ON public.orders;
CREATE TRIGGER trg_restore_stock_on_cancel
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancellation();

-- ── 5. Caller claim-order RPC (prevents race condition) ─────────────────────
-- Atomically sets status from 'new' → 'caller_pending' using SELECT FOR UPDATE.
-- Returns TRUE if the claim succeeded (order was still 'new'), FALSE otherwise.
CREATE OR REPLACE FUNCTION public.claim_order_for_caller(
  p_order_id UUID,
  p_user_id  UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  -- Lock the row; SKIP LOCKED means concurrent calls return FALSE immediately
  PERFORM 1
  FROM public.orders
  WHERE id = p_order_id AND status = 'new'
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.orders
  SET status     = 'caller_pending',
      updated_at = now()
  WHERE id     = p_order_id
    AND status = 'new';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_order_for_caller(UUID, UUID) TO authenticated;

-- ── 6. Index for webhook idempotency checks ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_provider_ref
  ON public.transactions(provider_reference)
  WHERE provider_reference IS NOT NULL;
