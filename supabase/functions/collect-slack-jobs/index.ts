// Slack collector agent.
//
// Reads recent messages from every Slack channel the CDTM Jobs bot has been
// added to, skips obvious non-job messages, and sends the rest through the
// extract-job-candidates agent. Jobs land in the /admin/review queue as
// drafts; nothing is published automatically.
//
// Runs on a schedule (see drizzle/migrations/0012_slack_collector.sql) with a service-role
// key. Needs the SLACK_BOT_TOKEN secret; without it the function does nothing.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { slackClient } from '../_shared/slack.ts'
import { collectSlackJobs } from '../_shared/slack-collector.ts'

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } })

// verify_jwt = true in config.toml: the gateway has already checked the
// signature, so only the role claim needs checking here.
function isServiceRole(h: string | null): boolean {
  const t = h?.startsWith('Bearer ') ? h.slice(7).trim() : ''
  const p = t.split('.')
  if (p.length !== 3) return false
  try {
    const s = p[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(s + '='.repeat((4 - (s.length % 4)) % 4)))?.role === 'service_role'
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const auth = req.headers.get('Authorization')
  if (!isServiceRole(auth)) return json({ error: 'Forbidden' }, 403)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const slackToken = Deno.env.get('SLACK_BOT_TOKEN')
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server not configured' }, 500)
  if (!slackToken) {
    // Expected until the Slack app is installed; not an error.
    console.log(JSON.stringify({ event: 'collect-slack-jobs', skipped: 'SLACK_BOT_TOKEN not set' }))
    return json({ ok: true, skipped: 'Slack is not connected yet (SLACK_BOT_TOKEN missing)' })
  }

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const result = await collectSlackJobs({
    slack: slackClient(slackToken),

    alreadyProcessed: async (channelId, timestamps) => {
      const done = new Set<string>()
      for (let i = 0; i < timestamps.length; i += 200) {
        const { data, error } = await db
          .from('slack_processed_messages')
          .select('message_ts')
          .eq('channel_id', channelId)
          .in('message_ts', timestamps.slice(i, i + 200))
        if (error) throw error
        for (const r of data ?? []) done.add(`${channelId}:${r.message_ts}`)
      }
      return done
    },

    markProcessed: async (record) => {
      const { error } = await db.from('slack_processed_messages').upsert(record, { onConflict: 'channel_id,message_ts' })
      if (error) console.error('markProcessed failed', error)
    },

    extract: async (text, sourceRef) => {
      const r = await fetch(`${supabaseUrl}/functions/v1/extract-job-candidates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: 'slack', source_ref: sourceRef }),
        signal: AbortSignal.timeout(60_000),
      })
      if (!r.ok) throw new Error(`extractor returned ${r.status}: ${(await r.text()).slice(0, 200)}`)
      const j = await r.json()
      return { found: j.found ?? 0, created: j.created?.length ?? 0 }
    },
  })

  console.log(JSON.stringify({ event: 'collect-slack-jobs', ...result }))
  return json({ ok: result.errors.length === 0, ...result })
})
