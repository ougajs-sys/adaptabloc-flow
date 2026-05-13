-- =============================================
-- SECURITY HARDENING
-- 1. Remove overly-broad anon SELECT on customers
--    (submit-form edge function uses service_role for lookups — anon read not needed)
-- 2. Narrow anon INSERT on customers to require phone (prevents blank customer spam)
-- =============================================

-- 1. Drop the anon read-all-customers policy
--    Anon users do not need to SELECT customers directly; the submit-form
--    edge function runs as service_role and handles the lookup internally.
DROP POLICY IF EXISTS "Anon can read customers for embed lookup" ON public.customers;

-- 2. Tighten anon INSERT: require phone to be non-empty
--    (The original policy allowed inserting customers with no contact info)
DROP POLICY IF EXISTS "Anon can create customers via embed" ON public.customers;

CREATE POLICY "Anon can create customers via embed"
  ON public.customers
  FOR INSERT
  TO anon
  WITH CHECK (
    phone IS NOT NULL
    AND length(trim(phone)) >= 8
    AND store_id IN (
      SELECT ef.store_id FROM public.embed_forms ef WHERE ef.status = 'active'
    )
  );
