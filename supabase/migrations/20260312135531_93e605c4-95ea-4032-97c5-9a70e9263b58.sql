
-- Re-add job listing management policies (needed for email-gated form without auth)
CREATE POLICY "Anyone can delete job listings"
ON public.job_listings
FOR DELETE
TO public
USING (true);

CREATE POLICY "Anyone can update job listings"
ON public.job_listings
FOR UPDATE
TO public
USING (true);
