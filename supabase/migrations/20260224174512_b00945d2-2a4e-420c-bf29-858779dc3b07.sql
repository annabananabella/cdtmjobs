CREATE POLICY "Anyone can delete job listings"
ON public.job_listings
FOR DELETE
USING (true);