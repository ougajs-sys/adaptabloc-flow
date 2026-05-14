-- Track the exact timestamp when an order was confirmed.
-- Used by Statistics to compute accurate avg preparation time.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
