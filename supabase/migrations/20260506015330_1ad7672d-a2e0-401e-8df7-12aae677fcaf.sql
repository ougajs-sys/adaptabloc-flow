ALTER TABLE public.whatsapp_otps
  ADD COLUMN IF NOT EXISTS signup_payload jsonb,
  ADD COLUMN IF NOT EXISTS name text;

CREATE INDEX IF NOT EXISTS idx_whatsapp_otps_code_hash ON public.whatsapp_otps(code_hash);
CREATE INDEX IF NOT EXISTS idx_whatsapp_otps_phone_purpose ON public.whatsapp_otps(phone_e164, purpose);