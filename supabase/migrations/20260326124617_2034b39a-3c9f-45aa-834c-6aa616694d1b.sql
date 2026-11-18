
-- Drop the broad anon policy
DROP POLICY "Anon can view companies via public view" ON public.companies;

-- Revoke default table-level SELECT for anon
REVOKE SELECT ON public.companies FROM anon;

-- Grant column-level SELECT only on non-sensitive columns
GRANT SELECT (id, name, accelerator, created_at) ON public.companies TO anon;

-- Re-add a policy scoped to anon that allows reading (RLS still applies)
CREATE POLICY "Anon can view company non-sensitive fields"
ON public.companies
FOR SELECT
TO anon
USING (true);

-- Clean up the view since we no longer need it
DROP VIEW IF EXISTS public.companies_public;
