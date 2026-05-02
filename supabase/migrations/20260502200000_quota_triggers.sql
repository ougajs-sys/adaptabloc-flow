-- =============================================
-- Server-side quota enforcement for embed_forms and landing_pages.
-- Free tier: max 2 embed forms, max 1 landing page per store.
-- These triggers run BEFORE INSERT and raise an error if the limit
-- is exceeded, so client-side bypass is not possible.
-- =============================================

-- ── 1. Embed forms: max 2 per store on free tier ─────────────────────────────
CREATE OR REPLACE FUNCTION public.check_embed_forms_quota()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
  v_has_unlimited BOOLEAN;
BEGIN
  -- Skip quota check if the store has an "unlimited_forms" paid module
  SELECT EXISTS (
    SELECT 1 FROM public.store_modules
    WHERE store_id = NEW.store_id AND module_id = 'unlimited_forms'
  ) INTO v_has_unlimited;

  IF v_has_unlimited THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.embed_forms
  WHERE store_id = NEW.store_id;

  IF v_count >= 2 THEN
    RAISE EXCEPTION 'Quota dépassé : le plan gratuit est limité à 2 formulaires. Passez à un plan supérieur pour en créer davantage.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_embed_forms_quota ON public.embed_forms;
CREATE TRIGGER trg_check_embed_forms_quota
  BEFORE INSERT ON public.embed_forms
  FOR EACH ROW EXECUTE FUNCTION public.check_embed_forms_quota();

-- ── 2. Landing pages: max 1 per store on free tier ───────────────────────────
CREATE OR REPLACE FUNCTION public.check_landing_pages_quota()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
  v_has_unlimited BOOLEAN;
BEGIN
  -- Skip quota check if the store has an "unlimited_landing_pages" paid module
  SELECT EXISTS (
    SELECT 1 FROM public.store_modules
    WHERE store_id = NEW.store_id AND module_id = 'unlimited_landing_pages'
  ) INTO v_has_unlimited;

  IF v_has_unlimited THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.landing_pages
  WHERE store_id = NEW.store_id;

  IF v_count >= 1 THEN
    RAISE EXCEPTION 'Quota dépassé : le plan gratuit est limité à 1 landing page. Passez à un plan supérieur pour en créer davantage.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_landing_pages_quota ON public.landing_pages;
CREATE TRIGGER trg_check_landing_pages_quota
  BEFORE INSERT ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.check_landing_pages_quota();
