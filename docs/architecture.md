# Architecture

```
 Sources                    Agent pipeline                          Board
 ───────                    ──────────────                          ─────
 shared inbox  ─┐
 Slack posts   ─┼─► collect ─► extract (LLM) ─► review queue ─► human approval ─► cdtmjobs.com
 pasted text   ─┘                                                                    ▲
                                                                                     │
 companies posting directly ─────────────────────────────────────────────────────────┘
```

- **Frontend**: a React single-page app. Public data is read directly from
  Postgres; row-level security decides what each visitor can see.
- **Backend**: Supabase (via Lovable Cloud) with Deno edge functions for
  anything that needs secrets or elevated rights, and scheduled jobs for the
  collectors, the newsletter and listing reminders.
- **Agents**: collectors turn emails and Slack posts into text; an LLM extracts
  structured listings, splits multi-role posts, fills gaps from the job page and
  skips duplicates.
- **Human in the loop**: nothing an agent finds is published automatically.
  Every listing is approved by a person first.
- **Testing**: pure logic is kept separate from I/O and covered by unit tests;
  CI runs type checks, linting, tests and a production build on every change.
