-- Review queue for job postings found by agents (Slack, email) or added by hand.
-- Nothing in this queue is public: a candidate only reaches job_listings when an
-- admin approves it through approve_job_candidate().

-- 1) Admins ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  email TEXT PRIMARY KEY CHECK (email = lower(email)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (and security-definer functions) can read it.
REVOKE ALL ON public.admin_users FROM anon, authenticated;
GRANT ALL ON public.admin_users TO service_role;

-- Admins are added per environment, not in code. To add one:
--   INSERT INTO public.admin_users (email) VALUES ('you@example.com');

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = public.current_user_email()
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 2) Candidates -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Where it came from
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'slack', 'email')),
  source_ref TEXT,            -- e.g. Slack permalink or email message id
  source_text TEXT,           -- the original message text, shown to the reviewer

  -- Proposed listing (all editable by the reviewer)
  company_name TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  job_title TEXT,
  job_url TEXT,
  work_mode TEXT CHECK (work_mode IS NULL OR work_mode IN ('remote', 'hybrid', 'onsite')),
  location TEXT,
  salary TEXT,
  equity TEXT,
  description TEXT,
  stage TEXT,
  accelerator TEXT,
  cdtm_only BOOLEAN NOT NULL DEFAULT false,

  -- Review state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  published_listing_id UUID REFERENCES public.job_listings(id) ON DELETE SET NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_candidates_status_created
  ON public.job_candidates (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_candidates_job_url
  ON public.job_candidates (lower(job_url));
-- The same Slack message / email must not be queued twice for the same link.
CREATE UNIQUE INDEX IF NOT EXISTS uq_job_candidates_source_url
  ON public.job_candidates (source, source_ref, lower(coalesce(job_url, '')))
  WHERE source_ref IS NOT NULL;

ALTER TABLE public.job_candidates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.job_candidates FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_candidates TO authenticated;
GRANT ALL ON public.job_candidates TO service_role;

CREATE POLICY "Admins manage job candidates"
  ON public.job_candidates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Service role manages job candidates"
  ON public.job_candidates FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_job_candidates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_candidates_updated_at ON public.job_candidates;
CREATE TRIGGER trg_job_candidates_updated_at
  BEFORE UPDATE ON public.job_candidates
  FOR EACH ROW EXECUTE FUNCTION public.touch_job_candidates_updated_at();

-- 3) Admin helpers --------------------------------------------------------

-- Companies for the reviewer's "match to existing company" picker
-- (includes the contact email, which is otherwise hidden from the browser).
CREATE OR REPLACE FUNCTION public.admin_list_companies()
RETURNS TABLE (id uuid, name text, email text, accelerator text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT c.id, c.name, c.email, c.accelerator
    FROM public.companies c
    ORDER BY lower(c.name);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_companies() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_companies() TO authenticated;

-- Existing listings with the same link (to flag duplicates before approving).
CREATE OR REPLACE FUNCTION public.admin_find_listing_by_url(p_url text)
RETURNS TABLE (id uuid, job_title text, is_active boolean, company_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT j.id, j.job_title, j.is_active, c.name
    FROM public.job_listings j
    JOIN public.companies c ON c.id = j.company_id
    WHERE rtrim(lower(j.job_url), '/') = rtrim(lower(trim(p_url)), '/');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_find_listing_by_url(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_find_listing_by_url(text) TO authenticated;

-- Publish a candidate: uses an existing company, or creates one
-- (new companies need a contact email, because companies.email is required
-- and is where listing refresh reminders are sent).
CREATE OR REPLACE FUNCTION public.approve_job_candidate(
  p_candidate_id uuid,
  p_new_company_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.job_candidates%ROWTYPE;
  v_company_id uuid;
  v_listing_id uuid;
  v_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO c FROM public.job_candidates WHERE id = p_candidate_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate not found';
  END IF;
  IF c.status <> 'pending' THEN
    RAISE EXCEPTION 'Candidate was already %', c.status;
  END IF;

  IF coalesce(trim(c.job_title), '') = '' THEN
    RAISE EXCEPTION 'Job title is required';
  END IF;
  IF coalesce(trim(c.job_url), '') = '' THEN
    RAISE EXCEPTION 'Job link is required';
  END IF;
  IF c.work_mode IS NULL THEN
    RAISE EXCEPTION 'Work mode (remote / hybrid / onsite) is required';
  END IF;

  v_company_id := c.company_id;

  IF v_company_id IS NULL THEN
    IF coalesce(trim(c.company_name), '') = '' THEN
      RAISE EXCEPTION 'Company name is required';
    END IF;

    -- Reuse a company with the same name if there is exactly one.
    SELECT id INTO v_company_id
    FROM public.companies
    WHERE lower(trim(name)) = lower(trim(c.company_name))
    ORDER BY created_at
    LIMIT 1;

    IF v_company_id IS NULL THEN
      v_email := lower(trim(coalesce(p_new_company_email, '')));
      IF v_email = '' OR position('@' in v_email) = 0 THEN
        RAISE EXCEPTION 'New company: a contact email is required';
      END IF;

      SELECT id INTO v_company_id FROM public.companies WHERE lower(email) = v_email;
      IF v_company_id IS NULL THEN
        INSERT INTO public.companies (name, email, accelerator)
        VALUES (trim(c.company_name), v_email, c.accelerator)
        RETURNING id INTO v_company_id;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.job_listings (
    company_id, job_title, job_url, work_mode, location, salary, equity,
    description, stage, accelerator, cdtm_only, is_active
  ) VALUES (
    v_company_id, trim(c.job_title), trim(c.job_url), c.work_mode, c.location, c.salary, c.equity,
    c.description, c.stage, c.accelerator, c.cdtm_only, true
  )
  RETURNING id INTO v_listing_id;

  UPDATE public.job_candidates
  SET status = 'approved',
      company_id = v_company_id,
      published_listing_id = v_listing_id,
      reviewed_by = public.current_user_email(),
      reviewed_at = now()
  WHERE id = p_candidate_id;

  RETURN v_listing_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_job_candidate(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_job_candidate(uuid, text) TO authenticated;