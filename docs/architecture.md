# Architecture

## Overview

```
                ┌──────────────────────────── Lovable Cloud (Supabase) ───────────────────────────┐
 Browser ──────►│ Postgres (RLS)   ◄── edge functions (Deno) ──► Lovable AI gateway / email / Gmail │
 (React SPA)    │      ▲  pg_cron schedules ──┘                                                     │
                └──────────────────────────────────────────────────────────────────────────────────┘
```

The site is a single-page React app. It reads public data straight from Postgres
through the Supabase client. Row-level security decides what each visitor may
see. Anything that needs secrets or elevated rights runs in an edge function or
a `SECURITY DEFINER` database function.

## Data model (main tables)

| Table | Purpose |
|---|---|
| `companies` | Hiring companies. `email` is the contact that receives listing reminders. It is hidden from the public. |
| `job_listings` | Published jobs. `cdtm_only` listings are visible only to signed-in CDTM users. |
| `job_candidates` | Review queue for jobs found by agents or added by admins. Never public. |
| `admin_users` | Admin email addresses. Readable only by the backend; checked with `is_admin()`. |
| `subscribers` | Newsletter subscribers. |
| `email_send_log` | One row per email send outcome. |
| `gmail_processed_messages` | Emails the Gmail collector has already handled. |
| `slack_processed_messages` | Slack messages the Slack collector has already handled. |

## Job intake pipeline

```
 forwarded email ──► collect-gmail-jobs (every 6h) ─┐
 Slack post      ──► collect-slack-jobs (daily) ─────┤
 pasted message  ──► /admin/review "Add jobs" ──────┼──► extract-job-candidates ──► job_candidates (pending)
                                                    │                                     │
                                                    │                       admin approves on /admin/review
                                                    │                                     ▼
                                                    │                    approve_job_candidate() ──► job_listings
                                                    │                                     │
                                                    └─────── sender is emailed "job published" (trigger)
```

1. **Collectors** turn a source into plain text. `collect-gmail-jobs` reads the
   agent inbox, `collect-slack-jobs` reads the Slack channels the CDTM Jobs bot
   was invited to, and admins can paste
   any message on `/admin/review`.
2. **`extract-job-candidates`** asks the AI for every opening in the text. It
   expands careers-page links into separate roles, then reads each job link to
   fill the details. The job page's title and description take precedence over
   the email's. It drops duplicates (already live, or already pending) and
   inserts the rest as `pending` candidates. Logic lives in
   `supabase/functions/_shared/job-extraction.ts` and is unit-tested.
3. **Review**: an admin edits, approves or rejects each candidate.
   `approve_job_candidate()` validates the fields, reuses or creates the company
   and publishes the listing.
4. **Notification**: when a candidate that came from an email is published, the
   approval trigger emails the original sender.

### Rules that keep the pipeline safe

- **Publish notifications go only to the email's From address**, which is stored as
  `job_candidates.sender_email`. Only backend collectors can set it. Cc'd people
  and addresses inside a post are never emailed.
- **Contact suggestions found on job pages are kept separate** from
  `sender_email`, so page content can never redirect notifications. A suggested
  contact is used only if the address actually appears on the page.
- **Nothing is published automatically.** Every listing passes human review.
- **Page fetching** blocks private and loopback hosts and redirects, and uses a
  timeout.

## Email

All app emails are sent synchronously through the managed send helper
(`sendAndLog` in `_shared/transactional-email-templates/send-and-log.ts`), which
logs every outcome to `email_send_log`. There is no email queue.

- **Auth emails** (magic links etc.): `auth-email-hook`.
- **Transactional emails** (subscription confirmation, listing reminders, job
  published): templates are registered in `_shared/transactional-email-templates/registry.ts`.
- **SQL helpers** (`admin_send_email`, `admin_send_refresh_check`) reach the
  sender through `send-app-email`, which accepts only service-role callers.
- **Bounces and complaints** are recorded by `handle-email-events`.

## Edge functions

| Function | Called by | Purpose |
|---|---|---|
| `extract-job-details` | browser (post-job form, review page) | Read one job page and pre-fill its fields. |
| `extract-job-candidates` | admins, collectors | Find all jobs in a message and queue them for review. |
| `collect-gmail-jobs` | pg_cron, every 6 hours | Read new emails in the agent inbox and send them to the extractor. |
| `collect-slack-jobs` | pg_cron, daily | Read new posts in the bot's Slack channels and send them to the extractor. Inactive until `SLACK_BOT_TOKEN` is set. |
| `subscribe-newsletter` | browser | Newsletter sign-up. |
| `send-newsletter` | admin or schedule | Send current openings to subscribers. |
| `reactivate-job` | link in reminder email | Keep a listing online after a reminder. |
| `send-app-email` | database helpers | Service-role-only email sender. |
| `auth-email-hook` | Supabase Auth | Branded auth emails. |
| `handle-email-events` | email provider | Record bounces and complaints. |
| `preview-transactional-email`, `admin-send-refresh-check` | Lovable tooling | Template previews and one-off reminder sends. |

## Security model

- Everything in the browser uses the **publishable (anon) key**. Access is
  controlled by row-level security, and sensitive columns (such as company
  emails) are not granted to anonymous users.
- **Admin functions** are `SECURITY DEFINER` and start with an `is_admin()` check.
- **Backend-only functions** are granted to `service_role` only. Edge functions
  that perform privileged actions require a service-role JWT (`verify_jwt = true`).
- **Secrets** live in the Lovable Cloud secret store; scheduled jobs read the
  service key from Supabase Vault.

## Conventions

- **Every schema change is a migration file** (tables, functions, grants,
  policies, cron schedules), even if it was first applied another way.
  New migrations go to `drizzle/migrations/`. `supabase/migrations/` holds the
  earlier history.
- **Display text is normalised when it is written** to the database (punctuation,
  no em dashes) for listings, candidates and company names. URLs and sender
  identity are never rewritten.
- **Location filters** use the country-label helper (`src/lib/location-country.ts`).
- **Company hover summaries** are a curated frontend map
  (`src/lib/company-summaries.ts`). Unknown companies get no summary rather
  than an invented one.
- **Pure logic is kept separate from I/O** so it can be unit-tested (see
  `job-extraction.ts`, `contact-name.ts`, `punctuation.ts`).
