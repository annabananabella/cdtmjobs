
-- Tighten subscribers INSERT policy to prevent self-assigning is_cdtm or is_active
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;

CREATE POLICY "Anyone can subscribe"
ON public.subscribers
FOR INSERT
TO public
WITH CHECK (is_cdtm = false AND is_active = true);
