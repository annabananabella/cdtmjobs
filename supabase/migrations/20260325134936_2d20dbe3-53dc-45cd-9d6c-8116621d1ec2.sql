DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;

CREATE POLICY "Anyone can subscribe" ON public.subscribers
  FOR INSERT TO public
  WITH CHECK (is_active = true);