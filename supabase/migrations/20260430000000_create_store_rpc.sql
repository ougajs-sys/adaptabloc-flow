-- RPC function to create a store for the current authenticated user.
-- SECURITY DEFINER bypasses RLS entirely (avoids "row violates RLS on stores").
-- Idempotent: returns the existing store_id if the user already has a store.
-- Activates selected modules atomically in the same call.

CREATE OR REPLACE FUNCTION public.create_store_for_user(
  p_name    TEXT,
  p_sector  TEXT    DEFAULT NULL,
  p_email   TEXT    DEFAULT NULL,
  p_phone   TEXT    DEFAULT NULL,
  p_modules TEXT[]  DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  UUID := auth.uid();
  v_store_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Idempotency: return existing store if user already has one
  SELECT store_id INTO v_store_id
  FROM public.user_roles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_store_id IS NOT NULL THEN
    RETURN v_store_id;
  END IF;

  -- Create the store (the handle_new_store trigger creates profile + admin role)
  INSERT INTO public.stores (name, owner_id, sector, email, phone)
  VALUES (p_name, v_user_id, p_sector, p_email, p_phone)
  RETURNING id INTO v_store_id;

  -- Update phone on the auto-created profile if provided
  IF p_phone IS NOT NULL THEN
    UPDATE public.profiles
    SET phone = p_phone
    WHERE user_id = v_user_id AND store_id = v_store_id;
  END IF;

  -- Activate selected paid modules
  IF array_length(p_modules, 1) > 0 THEN
    INSERT INTO public.store_modules (store_id, module_id)
    SELECT v_store_id, unnest(p_modules)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN v_store_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_store_for_user TO authenticated;
