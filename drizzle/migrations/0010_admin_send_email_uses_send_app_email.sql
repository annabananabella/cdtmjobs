-- Record the direct database change: admin_send_email and admin_send_refresh_check
-- now call the send-app-email function (the old send-transactional-email was removed).
-- CREATE OR REPLACE makes this idempotent against the live definitions.

CREATE OR REPLACE FUNCTION public.admin_send_email(p_template text, p_email text, p_data jsonb, p_idempotency_key text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE req_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://ipnpugitercjsawupazz.supabase.co/functions/v1/send-app-email',
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer '||(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')),
    body := jsonb_build_object('templateName', p_template, 'recipientEmail', p_email,
      'idempotencyKey', p_idempotency_key, 'templateData', p_data)
  ) INTO req_id;
  RETURN req_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_send_refresh_check(p_email text, p_first_name text, p_jobs jsonb, p_idempotency_key text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN public.admin_send_email('listing-refresh-check', p_email,
    jsonb_build_object('firstName', p_first_name, 'jobs', p_jobs), p_idempotency_key);
END;
$function$;

-- Keep the lock-down from 0001_lock_down_admin_send_email intact.
REVOKE EXECUTE ON FUNCTION public.admin_send_email(text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_email(text, text, jsonb, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.admin_send_refresh_check(text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_refresh_check(text, text, jsonb, text) TO service_role;
