-- Revoke email column access from authenticated role (matching existing anon restriction)
REVOKE SELECT (email) ON public.companies FROM authenticated;

-- Explicitly grant SELECT on non-sensitive columns to authenticated
GRANT SELECT (id, name, accelerator, created_at) ON public.companies TO authenticated;