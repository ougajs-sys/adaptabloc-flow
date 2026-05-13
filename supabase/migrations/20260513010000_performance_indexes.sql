-- =============================================
-- PERFORMANCE: MISSING DB INDEXES
-- Adds indexes for foreign-key and filter columns
-- that were identified as missing in the audit.
-- All use IF NOT EXISTS to be safe on re-run.
-- =============================================

-- ── orders table ─────────────────────────────────────────────────────────────
-- created_by / confirmed_by / prepared_by are FK columns used in JOINs and
-- team-performance queries but had no indexes, causing full table scans.

CREATE INDEX IF NOT EXISTS idx_orders_created_by
  ON public.orders(created_by);

CREATE INDEX IF NOT EXISTS idx_orders_confirmed_by
  ON public.orders(confirmed_by);

CREATE INDEX IF NOT EXISTS idx_orders_prepared_by
  ON public.orders(prepared_by);

-- assigned_driver_id is used in the deliveries + driver workspace queries
CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver
  ON public.orders(assigned_driver_id);

-- Composite index for date-range revenue queries (store + created_at)
CREATE INDEX IF NOT EXISTS idx_orders_store_created_at
  ON public.orders(store_id, created_at DESC);

-- ── product_variants table ────────────────────────────────────────────────────
-- product_id is a FK filtered on every product detail page load

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON public.product_variants(product_id);

-- ── order_items table ─────────────────────────────────────────────────────────
-- variant_id is a FK used in stock reconciliation queries

CREATE INDEX IF NOT EXISTS idx_order_items_variant_id
  ON public.order_items(variant_id);

-- ── campaign_recipients table ─────────────────────────────────────────────────
-- customer_id is frequently filtered when checking if a customer was already
-- targeted by a campaign

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_customer_id
  ON public.campaign_recipients(customer_id);

-- ── customers table ───────────────────────────────────────────────────────────
-- phone + store_id is the upsert key used by the embed form submit path;
-- a partial index on phone speeds up the lookup dramatically

CREATE INDEX IF NOT EXISTS idx_customers_store_phone
  ON public.customers(store_id, phone);

-- ── deliveries table ──────────────────────────────────────────────────────────
-- driver_id + status is used in the livreur workspace active-delivery query

CREATE INDEX IF NOT EXISTS idx_deliveries_driver_status
  ON public.deliveries(driver_id, status);
