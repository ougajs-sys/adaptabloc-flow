
-- Create admin_join_requests table
CREATE TABLE public.admin_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  requested_role text NOT NULL DEFAULT 'support',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON public.admin_join_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own requests"
  ON public.admin_join_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Superadmins can view all requests"
  ON public.admin_join_requests FOR SELECT TO authenticated
  USING (is_superadmin());

CREATE POLICY "Superadmins can update requests"
  ON public.admin_join_requests FOR UPDATE TO authenticated
  USING (is_superadmin());

CREATE POLICY "Superadmins can delete requests"
  ON public.admin_join_requests FOR DELETE TO authenticated
  USING (is_superadmin());

CREATE TRIGGER update_admin_join_requests_updated_at
  BEFORE UPDATE ON public.admin_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
