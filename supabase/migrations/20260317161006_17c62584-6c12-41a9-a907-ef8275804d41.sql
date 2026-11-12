
-- Drop the restrictive policy and replace with one that only enforces is_active
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;

CREATE POLICY "Anyone can subscribe"
ON public.subscribers
FOR INSERT
TO public
WITH CHECK (is_active = true);

-- Create a trigger to auto-set is_cdtm based on email domain (server-side, tamper-proof)
CREATE OR REPLACE FUNCTION public.set_subscriber_cdtm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.is_cdtm := (lower(NEW.email) LIKE '%@cdtm.de' OR lower(NEW.email) LIKE '%@cdtm.com');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_subscriber_cdtm_trigger
BEFORE INSERT ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.set_subscriber_cdtm();
