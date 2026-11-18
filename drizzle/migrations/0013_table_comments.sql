COMMENT ON TABLE public.job_candidates IS 'Review queue for job postings found by agents or added by admins; never public';
COMMENT ON TABLE public.gmail_processed_messages IS 'Emails the Gmail collector has already handled';
COMMENT ON TABLE public.slack_processed_messages IS 'Slack messages the Slack collector has already handled';