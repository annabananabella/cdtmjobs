-- Gmail intake runs every six hours from midnight Berlin time (cron is UTC: 23,5,11,17).
-- Idempotent: replaces any existing job with the same name. Matches the live schedule.
SELECT cron.unschedule('collect-gmail-jobs')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'collect-gmail-jobs');

SELECT cron.schedule(
  'collect-gmail-jobs',
  '0 23,5,11,17 * * *',
  $cron$select net.http_post(url:='https://ipnpugitercjsawupazz.supabase.co/functions/v1/collect-gmail-jobs',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='email_queue_service_role_key')),body:='{}'::jsonb,timeout_milliseconds:=120000)$cron$
);
