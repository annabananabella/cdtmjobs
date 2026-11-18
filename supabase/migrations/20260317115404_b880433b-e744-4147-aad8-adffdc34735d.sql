-- Use auth token email instead of querying auth.users in RLS / ownership checks
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(nullif(auth.jwt() ->> 'email', ''))
$$;

CREATE OR REPLACE FUNCTION public.is_company_owner(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = _company_id
      AND lower(email) = public.current_user_email()
  )
$$;

CREATE OR REPLACE FUNCTION public.lookup_company_by_email(lookup_email text)
RETURNS TABLE(id uuid, name text, email text, accelerator text, created_at timestamp with time zone, job_listings jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.email,
    c.accelerator,
    c.created_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', jl.id,
          'job_title', jl.job_title,
          'job_url', jl.job_url,
          'work_mode', jl.work_mode,
          'location', jl.location,
          'salary', jl.salary,
          'equity', jl.equity,
          'cdtm_only', jl.cdtm_only,
          'is_active', jl.is_active,
          'stage', jl.stage
        )
      ) FILTER (WHERE jl.id IS NOT NULL),
      '[]'::jsonb
    ) AS job_listings
  FROM public.companies c
  LEFT JOIN public.job_listings jl ON jl.company_id = c.id
  WHERE lower(c.email) = lower(lookup_email)
  GROUP BY c.id, c.name, c.email, c.accelerator, c.created_at;
END;
$$;

DROP POLICY IF EXISTS "Authenticated users can insert their own company" ON public.companies;
CREATE POLICY "Authenticated users can insert their own company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (lower(email) = public.current_user_email());

DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (lower(email) = public.current_user_email());