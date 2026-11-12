
CREATE OR REPLACE FUNCTION public.admin_send_email(p_template text, p_email text, p_data jsonb, p_idempotency_key text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE req_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://ipnpugitercjsawupazz.supabase.co/functions/v1/send-transactional-email',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer '||(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')
    ),
    body := jsonb_build_object(
      'templateName', p_template,
      'recipientEmail', p_email,
      'idempotencyKey', p_idempotency_key,
      'templateData', p_data
    )
  ) INTO req_id;
  RETURN req_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_send_email(text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_email(text, text, jsonb, text) TO service_role;
