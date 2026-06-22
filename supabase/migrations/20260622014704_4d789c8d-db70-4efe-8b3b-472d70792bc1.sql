
-- Replace permissive INSERT policies with auth.uid()-bound checks
DROP POLICY IF EXISTS "metrics_insert_auth" ON public.metrics;
CREATE POLICY "metrics_insert_auth" ON public.metrics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "logs_insert_auth" ON public.logs;
CREATE POLICY "logs_insert_auth" ON public.logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Revoke direct EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
