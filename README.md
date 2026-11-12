# CDTM Jobs

The job board of the CDTM network: **[cdtmjobs.com](https://cdtmjobs.com)**.
It lists open roles at CDTM-affiliated companies (startups and companies
founded, led or supported by the CDTM community), so CDTM students, alumni and
friends find their next role within the network.

## Features

- **Job board**: public listings, plus CDTM-only listings for people who sign in with a CDTM Google account.
- **Post a job**: companies sign in by email and submit roles. AI pre-fills the form from the job link.
- **Newsletter**: subscribers get the current openings by email.
- **Listing upkeep**: companies are asked monthly whether their older listings are still open.
- **Agent intake**: AI agents collect job posts from forwarded emails, Slack channels and pasted messages, and queue them for review.
  An admin approves every listing before it goes live.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix) |
| Backend | [Lovable Cloud](https://lovable.dev) (Supabase): Postgres with row-level security, Deno edge functions, pg_cron |
| AI | Lovable AI gateway (Gemini 2.5 Flash) for job extraction |
| Email | Lovable managed email (auth emails, transactional emails, newsletter) |

## Getting started

Requirements: [Bun](https://bun.sh) (or Node.js 20+ with npm).

```bash
bun install
bun run dev        # http://localhost:8080
```

Copy `.env.example` to `.env` and fill in your Supabase project's URL and
publishable (anon) key. These values are public by design: they ship to every
visitor's browser, and data access is enforced by row-level security in the
database. Backend secrets live in the hosting platform's secret store.

### Checks

```bash
bun run typecheck             # TypeScript (frontend)
bun run lint                  # ESLint
bun run test                  # frontend unit tests (Vitest)
bun run build                 # production build
bun run typecheck:functions   # edge functions type check (needs Deno)
bun run test:functions        # edge function unit tests (needs Deno)
```

All of these also run in CI on every pull request.

## Project structure

```
src/
  pages/            routes (board, post job, newsletter, admin pages, legal)
  components/       app components; components/ui = shadcn/ui primitives
  lib/              pure helpers (each with tests next to it)
  integrations/     generated Supabase client + types, Lovable auth
supabase/
  functions/        Deno edge functions (one folder per function)
  functions/_shared shared code: job extraction, email templates, helpers
  migrations/       SQL migrations (history up to the switch to drizzle/)
drizzle/migrations/ SQL migrations applied by Lovable Cloud
docs/               architecture and operating notes
```

See **[docs/architecture.md](docs/architecture.md)** for how the pieces fit together.

## Operations

- **Admins** are listed in the `admin_users` table (not in code). To add one, run:
  ```sql
  INSERT INTO public.admin_users (email) VALUES ('you@example.com');
  ```
  Admins can open `/admin/review` (job intake) and `/admin/newsletters`.
- **Secrets** (`LOVABLE_API_KEY`, `GOOGLE_MAIL_API_KEY`, …) live in the Lovable Cloud
  secret store and are never committed.
- **Database changes** are always recorded as migration files in the repo, so the
  repo matches the live database.
