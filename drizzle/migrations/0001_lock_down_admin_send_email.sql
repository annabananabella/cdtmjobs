-- Security fix: admin_send_email() is SECURITY DEFINER and sends any
-- transactional email template to any address using the service-role key.
-- Migration 20260720142727 granted EXECUTE to `authenticated`, which let any
-- signed-in visitor send emails from the site's domain. The app never calls
-- it from the browser, so restrict it to the backend (service role) only.

REVOKE EXECUTE ON FUNCTION public.admin_send_email(text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_email(text, text, jsonb, text) TO service_role;

-- Same hardening for the sibling admin helpers (they were already revoked from
-- anon/authenticated; make sure PUBLIC can't reach them either).
REVOKE EXECUTE ON FUNCTION public.admin_send_refresh_check(text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_trigger_newsletter() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_refresh_check(text, text, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_trigger_newsletter() TO service_role;