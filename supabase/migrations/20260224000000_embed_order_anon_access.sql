-- =============================================
-- MVP E-COMMERCE: Anon access for /embed/order
-- =============================================
-- Approach: allow anon INSERT on orders/order_items/customers
-- when the store_id matches a store that has at least one active embed_form.
-- This is coherent with the existing anon SELECT policy on embed_forms and products.

-- 1. Add payment_status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');

-- 2. Add payment_status column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending';

-- 3. Add index on orders.payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(store_id, payment_status);

-- 4. Anon INSERT on customers (upsert by phone+store_id for embed orders)
--    Only allowed when the store has an active embed form.
CREATE POLICY "Anon can create customers via embed"
  ON public.customers
  FOR INSERT
  TO anon
  WITH CHECK (
    store_id IN (
      SELECT ef.store_id FROM public.embed_forms ef WHERE ef.status = 'active'
    )
  );

-- 5. Anon SELECT on customers (needed to look up existing customer by phone)
CREATE POLICY "Anon can read customers for embed lookup"
  ON public.customers
  FOR SELECT
  TO anon
  USING (
    store_id IN (
      SELECT ef.store_id FROM public.embed_forms ef WHERE ef.status = 'active'
    )
  );

-- 6. Anon INSERT on orders
--    Only allowed when the store has an active embed form.
CREATE POLICY "Anon can create orders via embed"
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (
    store_id IN (
      SELECT ef.store_id FROM public.embed_forms ef WHERE ef.status = 'active'
    )
  );

-- 7. Anon INSERT on order_items
--    Only allowed when the parent order belongs to a store with an active embed form.
CREATE POLICY "Anon can create order items via embed"
  ON public.order_items
  FOR INSERT
  TO anon
  WITH CHECK (
    order_id IN (
      SELECT o.id
      FROM public.orders o
      JOIN public.embed_forms ef ON ef.store_id = o.store_id
      WHERE ef.status = 'active'
    )
  );
