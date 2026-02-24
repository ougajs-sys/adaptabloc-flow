
-- Create a security definer function to check superadmin without triggering RLS
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'superadmin'
  )
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "Superadmins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;

-- Recreate using the security definer function
CREATE POLICY "Superadmins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "Superadmins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_superadmin());
