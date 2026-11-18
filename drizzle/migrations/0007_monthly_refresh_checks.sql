CREATE OR REPLACE FUNCTION public.admin_monthly_refresh_checks()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE r record; n integer := 0;
BEGIN
  FOR r IN
    SELECT c.id, lower(c.email) AS email,
      jsonb_agg(jsonb_build_object('job_title', l.job_title,
        'posted_ago', 'posted ' || floor(extract(epoch FROM now() - l.created_at)/604800)::int || ' weeks ago')
        ORDER BY l.created_at) AS jobs
    FROM job_listings l JOIN companies c ON c.id = l.company_id
    WHERE l.is_active AND l.created_at < now() - interval '6 weeks'
      AND c.email IS NOT NULL AND c.email <> ''
    GROUP BY c.id, c.email
  LOOP
    PERFORM public.admin_send_refresh_check(r.email, public.person_name_from_email(r.email), r.jobs,
      'refresh-check-' || to_char(now(), 'YYYY-MM') || '-' || r.id);
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.admin_monthly_refresh_checks() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_monthly_refresh_checks() TO service_role;