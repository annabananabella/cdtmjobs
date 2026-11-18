
-- Tighten subscribers INSERT policy to block is_cdtm spoofing
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;

CREATE POLICY "Anyone can subscribe"
ON public.subscribers
FOR INSERT
TO public
WITH CHECK (is_cdtm = false AND is_active = true);

-- Recreate trigger to auto-set is_cdtm from email domain (tamper-proof)
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

DROP TRIGGER IF EXISTS set_subscriber_cdtm_trigger ON public.subscribers;

CREATE TRIGGER set_subscriber_cdtm_trigger
BEFORE INSERT ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.set_subscriber_cdtm();
