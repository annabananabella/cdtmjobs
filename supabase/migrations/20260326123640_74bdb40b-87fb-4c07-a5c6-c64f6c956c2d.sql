CREATE POLICY "Anon can view company public info"
ON public.companies
FOR SELECT
TO anon
USING (true);