CREATE OR REPLACE FUNCTION public.get_active_jobs_for_email(include_cdtm boolean DEFAULT false)
RETURNS TABLE(
  job_title text,
  company_name text,
  job_url text,
  work_mode text,
  location text,
  salary text,
  cdtm_only boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    jl.job_title,
    c.name AS company_name,
    jl.job_url,
    jl.work_mode,
    jl.location,
    jl.salary,
    jl.cdtm_only
  FROM public.job_listings jl
  JOIN public.companies c ON c.id = jl.company_id
  WHERE jl.is_active = true
    AND (include_cdtm OR jl.cdtm_only = false)
  ORDER BY jl.created_at DESC
  LIMIT 10;
$$;