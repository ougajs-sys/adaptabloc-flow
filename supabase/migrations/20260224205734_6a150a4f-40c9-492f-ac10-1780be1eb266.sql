
-- Add 'developer' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';

-- Allow superadmins to view all profiles
CREATE POLICY "Superadmins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'superadmin'
));

-- Allow superadmins to view all user_roles (cross-store)
CREATE POLICY "Superadmins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  AND ur.role = 'superadmin'
));

-- Allow superadmins to manage user_roles (for team invites)
CREATE POLICY "Superadmins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  AND ur.role = 'superadmin'
));

-- Allow superadmins to delete roles
CREATE POLICY "Superadmins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  AND ur.role = 'superadmin'
));
