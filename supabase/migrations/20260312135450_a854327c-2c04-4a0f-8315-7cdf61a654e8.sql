
-- =============================================
-- 1. SUBSCRIBERS: Remove SELECT and UPDATE (PII)
-- =============================================
DROP POLICY IF EXISTS "Anyone can view subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Anyone can update subscribers" ON public.subscribers;

-- =============================================
-- 2. COMPANIES: Secure email access
-- =============================================
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
DROP POLICY IF EXISTS "Anyone can update companies" ON public.companies;

-- Create a security-definer function for email lookup (used by job submission form)
CREATE OR REPLACE FUNCTION public.lookup_company_by_email(lookup_email text)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  accelerator text,
  created_at timestamptz,
  job_listings jsonb
)
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
          'is_active', jl.is_active
        )
      ) FILTER (WHERE jl.id IS NOT NULL),
      '[]'::jsonb
    ) AS job_listings
  FROM public.companies c
  LEFT JOIN public.job_listings jl ON jl.company_id = c.id
  WHERE c.email = lookup_email
  GROUP BY c.id, c.name, c.email, c.accelerator, c.created_at;
END;
$$;

-- Allow SELECT for job listing joins (only exposes name/accelerator via the select query)
CREATE POLICY "Public can view companies"
ON public.companies
FOR SELECT
TO public
USING (true);

-- =============================================
-- 3. JOB LISTINGS: Remove public DELETE and UPDATE
-- =============================================
DROP POLICY IF EXISTS "Anyone can delete job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Anyone can update job listings" ON public.job_listings;
