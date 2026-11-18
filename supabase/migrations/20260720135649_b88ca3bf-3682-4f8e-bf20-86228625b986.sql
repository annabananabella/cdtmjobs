
INSERT INTO public.job_reactivation_tokens (token, job_listing_id)
SELECT encode(extensions.gen_random_bytes(24), 'hex'), jl.id
FROM public.job_listings jl
WHERE jl.is_active = true AND jl.created_at < now() - interval '6 weeks'
  AND NOT EXISTS (SELECT 1 FROM public.job_reactivation_tokens t WHERE t.job_listing_id = jl.id AND t.used_at IS NULL);
