
CREATE TABLE public.module_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id text NOT NULL UNIQUE,
  price integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users DEFAULT NULL
);

ALTER TABLE public.module_pricing ENABLE ROW LEVEL SECURITY;

-- Only superadmins can manage pricing
CREATE POLICY "Superadmins can manage pricing" ON public.module_pricing
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Authenticated users can read pricing (needed for billing display)
CREATE POLICY "Authenticated can read pricing" ON public.module_pricing
  FOR SELECT USING (auth.uid() IS NOT NULL);
