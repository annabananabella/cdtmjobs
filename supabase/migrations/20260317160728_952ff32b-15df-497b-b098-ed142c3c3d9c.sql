
-- Fix 1: Remove the overly permissive anon SELECT on companies (exposes emails)
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;

-- Fix 2: Rewrite current_user_email() to resolve from auth.users (immutable uid) instead of JWT claim
CREATE OR REPLACE FUNCTION public.current_user_email()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT lower(email) FROM auth.users WHERE id = auth.uid()
$$;
