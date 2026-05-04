-- =============================================
-- Counter-audit fix: atomic stock management via triggers
--
-- Replaces the client-side stock manipulation in Orders.tsx and the
-- missing stock deduction in submit-form (embed orders) with a single
-- DB-level source of truth. Fixes:
--   1. Race condition: client-side read-then-write was not atomic.
--   2. Stock not restored when an order item is edited (qty changed).
--   3. Stock not restored when an order is deleted (or its items).
--   4. Embed form orders never deducted stock.
-- =============================================

-- ── 1. Stock adjustment on every order_items mutation ────────────────────────
CREATE OR REPLACE FUNCTION public.adjust_stock_on_order_item()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_order_status TEXT;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.product_id IS NOT NULL THEN
      UPDATE public.products
        SET stock = GREATEST(0, COALESCE(stock, 0) - NEW.quantity)
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.product_id IS DISTINCT FROM OLD.product_id THEN
      -- Product swapped: restore old, deduct new
      IF OLD.product_id IS NOT NULL THEN
        UPDATE public.products
          SET stock = COALESCE(stock, 0) + OLD.quantity
          WHERE id = OLD.product_id;
      END IF;
      IF NEW.product_id IS NOT NULL THEN
        UPDATE public.products
          SET stock = GREATEST(0, COALESCE(stock, 0) - NEW.quantity)
          WHERE id = NEW.product_id;
      END IF;
    ELSIF NEW.quantity != OLD.quantity AND NEW.product_id IS NOT NULL THEN
      -- Same product, qty delta
      UPDATE public.products
        SET stock = GREATEST(0, COALESCE(stock, 0) - (NEW.quantity - OLD.quantity))
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    -- Look up parent order. Skip restoration if:
    --   (a) order row is gone (cascade DELETE — already handled by trg_restore_stock_on_order_delete)
    --   (b) order is already cancelled/returned (cancellation trigger already restored)
    SELECT status INTO v_order_status FROM public.orders WHERE id = OLD.order_id;

    IF v_order_status IS NOT NULL AND v_order_status NOT IN ('cancelled', 'returned') THEN
      IF OLD.product_id IS NOT NULL THEN
        UPDATE public.products
          SET stock = COALESCE(stock, 0) + OLD.quantity
          WHERE id = OLD.product_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_adjust_stock_on_order_item ON public.order_items;
CREATE TRIGGER trg_adjust_stock_on_order_item
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.adjust_stock_on_order_item();

-- ── 2. Restore stock when an order itself is deleted (before cascade) ────────
-- Without this, deleting a non-cancelled order would lose stock forever
-- (the cascading order_items DELETE happens after the orders row is gone,
--  so the AFTER DELETE on order_items can't look up the parent status).
CREATE OR REPLACE FUNCTION public.restore_stock_before_order_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status NOT IN ('cancelled', 'returned') THEN
    UPDATE public.products p
      SET stock = COALESCE(p.stock, 0) + oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = OLD.id
        AND oi.product_id = p.id
        AND p.store_id = OLD.store_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_restore_stock_before_order_delete ON public.orders;
CREATE TRIGGER trg_restore_stock_before_order_delete
  BEFORE DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_before_order_delete();

-- =============================================
-- IMPORTANT — application-side change required:
-- Orders.tsx must NOT manually update products.stock anymore. The trigger
-- above handles all cases (create/edit/delete/cancel/return). The same applies
-- to the submit-form edge function (embed form orders), which previously
-- didn't deduct stock at all and now will via the trigger.
-- =============================================
