
-- Update the authenticated SELECT policy to also allow company owners to see their own listings
DROP POLICY IF EXISTS "Authenticated users can view listings" ON public.job_listings;

CREATE POLICY "Authenticated users can view listings"
ON public.job_listings FOR SELECT TO authenticated
USING (
  cdtm_only = false
  OR public.is_cdtm_user()
  OR public.is_company_owner(company_id)
);
