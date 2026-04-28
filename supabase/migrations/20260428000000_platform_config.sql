-- Table de configuration globale de la plateforme (clé/valeur)
CREATE TABLE public.platform_config (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Lecture autorisée pour les admins authentifiés
CREATE POLICY "Superadmins can read config"
  ON public.platform_config FOR SELECT TO authenticated
  USING (is_superadmin());

-- Écriture réservée aux superadmins
CREATE POLICY "Superadmins can upsert config"
  ON public.platform_config FOR INSERT TO authenticated
  WITH CHECK (is_superadmin());

CREATE POLICY "Superadmins can update config"
  ON public.platform_config FOR UPDATE TO authenticated
  USING (is_superadmin());

-- Valeur initiale du mode maintenance
INSERT INTO public.platform_config (key, value) VALUES ('maintenance_mode', 'false');
