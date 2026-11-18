
-- Restrict companies SELECT to only the authenticated user's own company
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;

CREATE POLICY "Users can view their own company"
ON public.companies FOR SELECT TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
