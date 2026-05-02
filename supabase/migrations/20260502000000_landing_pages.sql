-- =============================================
-- LANDING PAGES
-- Each store can create public landing pages tied to a product
-- and an embedded order form. Two modes: "template" (auto-generated
-- from structured data) and "html" (custom HTML pasted by the merchant,
-- rendered in a sandboxed iframe on the public side).
-- =============================================

CREATE TABLE IF NOT EXISTS public.landing_pages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
  embed_form_id   UUID REFERENCES public.embed_forms(id) ON DELETE SET NULL,

  -- Public URL slug (globally unique). URL: /p/:slug
  slug            TEXT NOT NULL UNIQUE,

  -- Common fields
  title           TEXT NOT NULL,
  description     TEXT,
  meta_title      TEXT,
  meta_description TEXT,

  -- Mode: "template" (structured) or "html" (raw)
  mode            TEXT NOT NULL DEFAULT 'template' CHECK (mode IN ('template', 'html')),

  -- Template mode data (hero_title, hero_subtitle, hero_image_url,
  -- cta_text, primary_color, features array, show_form, etc.)
  template_data   JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- HTML mode payload (raw HTML pasted by the merchant)
  html_content    TEXT,

  -- Status & analytics
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  views_count     INTEGER NOT NULL DEFAULT 0,
  conversions_count INTEGER NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_landing_pages_store ON public.landing_pages(store_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug  ON public.landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON public.landing_pages(status);

CREATE TRIGGER tr_landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Admins of the store manage their landing pages
CREATE POLICY "Admins can view their landing pages"
  ON public.landing_pages FOR SELECT
  USING (public.has_role(store_id, 'admin'));

CREATE POLICY "Admins can create landing pages"
  ON public.landing_pages FOR INSERT
  WITH CHECK (public.has_role(store_id, 'admin'));

CREATE POLICY "Admins can update their landing pages"
  ON public.landing_pages FOR UPDATE
  USING (public.has_role(store_id, 'admin'));

CREATE POLICY "Admins can delete their landing pages"
  ON public.landing_pages FOR DELETE
  USING (public.has_role(store_id, 'admin'));

-- Public read access for PUBLISHED pages only
CREATE POLICY "Public can view published landing pages"
  ON public.landing_pages FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- =============================================
-- RPC: increment views (callable by anon, bypasses RLS)
-- =============================================

CREATE OR REPLACE FUNCTION public.increment_landing_page_views(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.landing_pages
  SET views_count = views_count + 1
  WHERE slug = p_slug AND status = 'published';
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_landing_page_views TO anon, authenticated;
