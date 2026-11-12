GRANT EXECUTE ON FUNCTION public.admin_send_email(text, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_email(text, text, jsonb, text) TO service_role;