-- Table des invitations d'équipe
CREATE TABLE public.team_invitations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  role       public.app_role NOT NULL DEFAULT 'caller',
  token      TEXT DEFAULT encode(gen_random_bytes(24), 'hex'),
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (store_id, email)
);

CREATE INDEX idx_team_invitations_store ON public.team_invitations(store_id, status);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Les admins du store peuvent voir, créer et supprimer les invitations
CREATE POLICY "Admins can view invitations"
  ON public.team_invitations FOR SELECT
  TO authenticated
  USING (public.has_role(store_id, 'admin'));

CREATE POLICY "Admins can create invitations"
  ON public.team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(store_id, 'admin'));

CREATE POLICY "Admins can delete invitations"
  ON public.team_invitations FOR DELETE
  TO authenticated
  USING (public.has_role(store_id, 'admin'));

-- Trigger updated_at
CREATE TRIGGER tr_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
