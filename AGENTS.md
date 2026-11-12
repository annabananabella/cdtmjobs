# Rules for coding agents

Read `docs/architecture.md` first. These rules are binding:

1. **Schema changes are migrations.** Record every change to tables, functions,
   grants, policies or cron schedules as a file in `drizzle/migrations/`, even if
   it was applied another way. The repo must always match the live database.
2. **No personal data or one-off operations in migrations.** Test emails, data
   clean-ups and admin seeds are run directly, never committed.
3. **Nothing is published automatically.** Agent-found jobs go to
   `job_candidates`; only `approve_job_candidate()` creates listings.
4. **Notifications go only to `job_candidates.sender_email`**, which only trusted
   backend collectors set. Never email cc'd addresses or addresses found in
   message or page content. Keep page-derived contact suggestions separate.
5. **Privileged code is backend-only.** `SECURITY DEFINER` functions check
   `is_admin()` or are granted to `service_role` only. Edge functions that act
   with elevated rights require a service-role JWT.
6. **Normalise display text at write time** (punctuation, no em dashes). Never
   rewrite URLs or sender identity.
7. **Keep logic testable.** Put pure logic in `src/lib/` or
   `supabase/functions/_shared/`, with tests, and keep I/O in thin wrappers.
8. **Before finishing:** run `bun run check`, `bun run typecheck:functions` and
   `bun run test:functions`. CI runs the same checks on every pull request.
