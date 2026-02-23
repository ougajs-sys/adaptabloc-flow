-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add unique constraint on subscriptions for store_id to support upsert
-- First check if one already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_store_id_unique'
  ) THEN
    -- We allow multiple subscriptions per store (historical) but only one active
    -- So we use a partial unique index instead
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_store 
    ON public.subscriptions (store_id) 
    WHERE status = 'active';
  END IF;
END $$;
