-- Allow service_role to update subscribers (for unsubscribe)
CREATE POLICY "Service role can update subscribers"
ON public.subscribers
FOR UPDATE
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Allow service_role to read subscribers (for newsletter)
CREATE POLICY "Service role can read subscribers"
ON public.subscribers
FOR SELECT
USING (auth.role() = 'service_role'::text);