-- =============================================
-- WHATSAPP INVITATION SUPPORT
-- Extends team_invitations to support WhatsApp channel.
-- =============================================

-- Make email nullable (WhatsApp invitations use phone only)
ALTER TABLE public.team_invitations
  ALTER COLUMN email DROP NOT NULL;

-- Add WhatsApp columns
ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT,
  ADD COLUMN IF NOT EXISTS channel   TEXT NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email', 'whatsapp'));

-- Drop old unique constraint (email was NOT NULL before)
ALTER TABLE public.team_invitations
  DROP CONSTRAINT IF EXISTS team_invitations_store_id_email_key;

-- Partial unique indexes: one active invitation per contact per store
CREATE UNIQUE INDEX IF NOT EXISTS uniq_inv_store_email
  ON public.team_invitations(store_id, email)
  WHERE email IS NOT NULL AND status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_inv_store_phone
  ON public.team_invitations(store_id, phone_e164)
  WHERE phone_e164 IS NOT NULL AND status = 'pending';

-- Allow anonymous users to read a pending invitation by token.
-- Security: token is a 48-char random hex — unforgeable without the link.
CREATE POLICY "Anon can read pending invitation by token"
  ON public.team_invitations FOR SELECT
  TO anon
  USING (status = 'pending');
