CREATE OR REPLACE FUNCTION public.admin_newsletter_history()
RETURNS TABLE(sent_at timestamptz, recipient_email text, status text, bounced boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT l.created_at, l.recipient_email, l.status,
    EXISTS (SELECT 1 FROM public.email_send_log b
            WHERE b.template_name = 'system' AND b.status IN ('bounced','complained')
              AND lower(b.recipient_email) = lower(l.recipient_email) AND b.created_at >= l.created_at)
  FROM public.email_send_log l
  WHERE l.template_name = 'newsletter' AND l.status IN ('sent','failed','suppressed')
  ORDER BY l.created_at DESC
  LIMIT 2000;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_newsletter_history() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_newsletter_history() TO authenticated;