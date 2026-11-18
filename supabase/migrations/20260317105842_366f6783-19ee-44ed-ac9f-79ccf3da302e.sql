
-- Helper: check if authenticated user has a CDTM email
CREATE OR REPLACE FUNCTION public.is_cdtm_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND (email ILIKE '%@cdtm.de' OR email ILIKE '%@cdtm.com')
  )
$$;

-- Replace the authenticated SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all listings" ON public.job_listings;

-- CDTM users see everything, non-CDTM authenticated users see only public listings
CREATE POLICY "Authenticated users can view listings"
ON public.job_listings FOR SELECT TO authenticated
USING (cdtm_only = false OR public.is_cdtm_user());
