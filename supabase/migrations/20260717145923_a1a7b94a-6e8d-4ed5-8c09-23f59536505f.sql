
CREATE TABLE public.job_reactivation_tokens (
  token TEXT PRIMARY KEY,
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);
CREATE INDEX idx_job_reactivation_tokens_job ON public.job_reactivation_tokens(job_listing_id);

GRANT ALL ON public.job_reactivation_tokens TO service_role;

ALTER TABLE public.job_reactivation_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages reactivation tokens"
  ON public.job_reactivation_tokens FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
