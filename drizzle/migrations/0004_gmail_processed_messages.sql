CREATE TABLE public.gmail_processed_messages (message_id text PRIMARY KEY, processed_at timestamptz NOT NULL DEFAULT now(), found int NOT NULL DEFAULT 0, created int NOT NULL DEFAULT 0);
GRANT ALL ON public.gmail_processed_messages TO service_role;
ALTER TABLE public.gmail_processed_messages ENABLE ROW LEVEL SECURITY;