-- Records the live schedules (Berlin times; cron runs in UTC). cron.schedule with an existing name updates in place, so this is idempotent.
SELECT cron.schedule(
  'send-biweekly-newsletter',
  '0 9 * * 1',
  $$SELECT public.admin_trigger_newsletter() WHERE NOT EXISTS (SELECT 1 FROM public.email_send_log WHERE template_name = 'newsletter' AND status = 'sent' AND created_at > now() - interval '10 days')$$
);
SELECT cron.schedule(
  'monthly-refresh-checks',
  '17 8 1 * *',
  $$SELECT public.admin_monthly_refresh_checks()$$
);