-- 1) Hide company email from anonymous viewers
REVOKE SELECT (email) ON public.companies FROM anon;
GRANT SELECT (id, name, accelerator, created_at) ON public.companies TO anon;

-- 2) Lock down resubscribe_email so only the service role / backend can call it.
REVOKE EXECUTE ON FUNCTION public.resubscribe_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resubscribe_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resubscribe_email(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.resubscribe_email(text) TO service_role;