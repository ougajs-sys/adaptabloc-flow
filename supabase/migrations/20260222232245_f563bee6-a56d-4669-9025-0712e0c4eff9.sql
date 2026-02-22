
-- Table to persist active modules per store
CREATE TABLE public.store_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, module_id)
);

ALTER TABLE public.store_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store members can view modules"
ON public.store_modules FOR SELECT
USING (is_store_member(store_id));

CREATE POLICY "Admins can insert modules"
ON public.store_modules FOR INSERT
WITH CHECK (has_role(store_id, 'admin'::app_role));

CREATE POLICY "Admins can delete modules"
ON public.store_modules FOR DELETE
USING (has_role(store_id, 'admin'::app_role));

-- Enable realtime for instant sync across tabs/devices
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_modules;
