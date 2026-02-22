
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_facebook_id ON public.profiles(facebook_id);
