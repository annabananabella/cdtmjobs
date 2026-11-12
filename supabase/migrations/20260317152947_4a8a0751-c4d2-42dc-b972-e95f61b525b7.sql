-- Allow anonymous users to read company names (for job board filters)
CREATE POLICY "Anyone can view companies"
ON public.companies
FOR SELECT
TO anon
USING (true);
