
-- Restrict companies SELECT to authenticated users only
DROP POLICY IF EXISTS "Public can view companies" ON public.companies;

CREATE POLICY "Authenticated users can view companies"
ON public.companies FOR SELECT TO authenticated
USING (true);
