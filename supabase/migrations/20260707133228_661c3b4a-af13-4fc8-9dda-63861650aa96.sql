-- Allow public read access to non-sensitive company columns (name, accelerator) via join.
-- Email column is protected: no anon/authenticated column grant, so it stays hidden.

GRANT SELECT (id, name, accelerator, created_at) ON public.companies TO anon, authenticated;

CREATE POLICY "Public can view company non-sensitive fields"
  ON public.companies FOR SELECT
  TO anon, authenticated
  USING (true);