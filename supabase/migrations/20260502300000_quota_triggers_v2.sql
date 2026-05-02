-- =============================================
-- Quota triggers v2: use extra_forms / extra_landing_pages modules
-- (replaces the module IDs used in v1)
-- =============================================

-- ── 1. Embed forms: 2 free, +3 with extra_forms module ───────────────────────
CREATE OR REPLACE FUNCTION public.check_embed_forms_quota()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_count     INTEGER;
  v_has_extra BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.store_modules
    WHERE store_id = NEW.store_id AND module_id = 'extra_forms'
  ) INTO v_has_extra;

  SELECT COUNT(*) INTO v_count
  FROM public.embed_forms
  WHERE store_id = NEW.store_id;

  IF v_has_extra AND v_count >= 5 THEN
    RAISE EXCEPTION 'Quota dépassé : le module "+3 Formulaires" permet jusqu''à 5 formulaires. Achetez un module supplémentaire pour en créer davantage.';
  END IF;

  IF NOT v_has_extra AND v_count >= 2 THEN
    RAISE EXCEPTION 'Quota dépassé : le plan gratuit est limité à 2 formulaires. Achetez le module "+3 Formulaires" dans la page Modules.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_embed_forms_quota ON public.embed_forms;
CREATE TRIGGER trg_check_embed_forms_quota
  BEFORE INSERT ON public.embed_forms
  FOR EACH ROW EXECUTE FUNCTION public.check_embed_forms_quota();

-- ── 2. Landing pages: 1 free, +5 with extra_landing_pages module ─────────────
CREATE OR REPLACE FUNCTION public.check_landing_pages_quota()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_count     INTEGER;
  v_has_extra BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.store_modules
    WHERE store_id = NEW.store_id AND module_id = 'extra_landing_pages'
  ) INTO v_has_extra;

  SELECT COUNT(*) INTO v_count
  FROM public.landing_pages
  WHERE store_id = NEW.store_id;

  IF v_has_extra AND v_count >= 6 THEN
    RAISE EXCEPTION 'Quota dépassé : le module "+5 Landing Pages" permet jusqu''à 6 pages. Achetez un module supplémentaire pour en créer davantage.';
  END IF;

  IF NOT v_has_extra AND v_count >= 1 THEN
    RAISE EXCEPTION 'Quota dépassé : le plan gratuit est limité à 1 landing page. Achetez le module "+5 Landing Pages" dans la page Modules.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_landing_pages_quota ON public.landing_pages;
CREATE TRIGGER trg_check_landing_pages_quota
  BEFORE INSERT ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.check_landing_pages_quota();
