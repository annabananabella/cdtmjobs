DROP POLICY IF EXISTS "Anon can view company non-sensitive fields" ON public.companies;
DROP POLICY IF EXISTS "Authenticated can view all companies" ON public.companies;