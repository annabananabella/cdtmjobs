CREATE POLICY "Authenticated can view all companies"
ON public.companies
FOR SELECT
TO authenticated
USING (true);