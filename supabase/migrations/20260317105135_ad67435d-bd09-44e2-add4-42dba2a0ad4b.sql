
-- Helper: check if the authenticated user owns a company
CREATE OR REPLACE FUNCTION public.is_company_owner(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = _company_id
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
$$;

-- job_listings: drop permissive UPDATE/DELETE/INSERT policies
DROP POLICY IF EXISTS "Anyone can delete job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Anyone can update job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Anyone can insert job listings" ON public.job_listings;

-- job_listings: authenticated company owners can INSERT their own listings
CREATE POLICY "Company owners can insert job listings"
ON public.job_listings FOR INSERT TO authenticated
WITH CHECK (public.is_company_owner(company_id));

-- job_listings: authenticated company owners can UPDATE their own listings
CREATE POLICY "Company owners can update job listings"
ON public.job_listings FOR UPDATE TO authenticated
USING (public.is_company_owner(company_id));

-- job_listings: authenticated company owners can DELETE their own listings
CREATE POLICY "Company owners can delete job listings"
ON public.job_listings FOR DELETE TO authenticated
USING (public.is_company_owner(company_id));

-- companies: drop the wide-open INSERT policy
DROP POLICY IF EXISTS "Anyone can insert companies" ON public.companies;

-- companies: only authenticated users can insert, and only for their own email
CREATE POLICY "Authenticated users can insert their own company"
ON public.companies FOR INSERT TO authenticated
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
