CREATE OR REPLACE FUNCTION public.resubscribe_email(subscriber_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove from suppression list
  DELETE FROM public.suppressed_emails
  WHERE email = lower(subscriber_email);
  
  -- Reset unsubscribe token so a new one can be created
  DELETE FROM public.email_unsubscribe_tokens
  WHERE email = lower(subscriber_email);
END;
$$;