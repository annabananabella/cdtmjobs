-- Slack collector: remembers which Slack messages were already read, and runs
-- the collect-slack-jobs function once a day. Until the SLACK_BOT_TOKEN secret
-- is set, the scheduled run does nothing.

CREATE TABLE IF NOT EXISTS public.slack_processed_messages (
  channel_id TEXT NOT NULL,
  message_ts TEXT NOT NULL,
  found INT NOT NULL DEFAULT 0,
  created INT NOT NULL DEFAULT 0,
  skipped_reason TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, message_ts)
);

ALTER TABLE public.slack_processed_messages ENABLE ROW LEVEL SECURITY;
-- No policies: backend (service role) only.
REVOKE ALL ON public.slack_processed_messages FROM anon, authenticated;
GRANT ALL ON public.slack_processed_messages TO service_role;

-- Daily at 06:17 UTC (07:17/08:17 in Munich), before people check the board.
-- Uses the same vault-stored service key as the other scheduled jobs.
SELECT cron.schedule(
  'collect-slack-jobs',
  '17 6 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://ipnpugitercjsawupazz.supabase.co/functions/v1/collect-slack-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
  $cron$
);
