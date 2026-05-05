
-- Revoke EXECUTE from anon/public for SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_store_member(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_store_owner(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_superadmin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_store_ids() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_store_for_user(text, text, text, text, text[]) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_store_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_store_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_store_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_store_for_user(text, text, text, text, text[]) TO authenticated;

-- Internal trigger functions: revoke from everyone (only the DB engine needs them)
REVOKE EXECUTE ON FUNCTION public.handle_new_store() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_invited_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
