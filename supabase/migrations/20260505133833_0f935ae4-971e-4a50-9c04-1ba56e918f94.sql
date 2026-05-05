
-- Ajout colonnes profil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_phone_e164 ON public.profiles(phone_e164) WHERE phone_e164 IS NOT NULL;

-- Table OTP
CREATE TABLE IF NOT EXISTS public.whatsapp_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL,
  email text,
  user_id uuid,
  code_hash text NOT NULL,
  purpose text NOT NULL DEFAULT 'signup',
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_otps_phone_purpose
  ON public.whatsapp_otps(phone_e164, purpose, created_at DESC);

ALTER TABLE public.whatsapp_otps ENABLE ROW LEVEL SECURITY;
-- Pas de policies => seul service_role (edge functions) peut accéder.

-- Table audit / rate-limit
CREATE TABLE IF NOT EXISTS public.whatsapp_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL,
  ip text,
  purpose text NOT NULL DEFAULT 'signup',
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_send_log_phone ON public.whatsapp_send_log(phone_e164, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_send_log_ip ON public.whatsapp_send_log(ip, created_at DESC) WHERE ip IS NOT NULL;

ALTER TABLE public.whatsapp_send_log ENABLE ROW LEVEL SECURITY;
-- Pas de policies => seul service_role peut lire/écrire.
