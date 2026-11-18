
-- Replace the open SELECT policy with one that hides cdtm_only listings from anonymous users
DROP POLICY IF EXISTS "Anyone can view job listings" ON public.job_listings;

-- Public (anon) can only see non-cdtm_only listings
CREATE POLICY "Public can view non-cdtm listings"
ON public.job_listings FOR SELECT TO anon
USING (cdtm_only = false);

-- Authenticated users can see all listings
CREATE POLICY "Authenticated users can view all listings"
ON public.job_listings FOR SELECT TO authenticated
USING (true);
