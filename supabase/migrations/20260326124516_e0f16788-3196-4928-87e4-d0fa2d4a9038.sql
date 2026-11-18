
-- Fix: make the view security invoker (safe)
ALTER VIEW public.companies_public SET (security_invoker = on);

-- Grant anon read access to the view
GRANT SELECT ON public.companies_public TO anon;

-- Add a policy so anon can read companies through the view (limited to what the view exposes)
CREATE POLICY "Anon can view companies via public view"
ON public.companies
FOR SELECT
TO anon
USING (true);
