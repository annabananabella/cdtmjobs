
-- Create a secure view exposing only non-sensitive company fields
CREATE OR REPLACE VIEW public.companies_public AS
SELECT id, name, accelerator
FROM public.companies;

-- Drop the overly permissive anon policy
DROP POLICY "Anon can view company public info" ON public.companies;
