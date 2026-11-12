// One-shot admin helper: sends the "listing-refresh-check" transactional
// email to a list of recipients. Guarded by LOVABLE_API_KEY (Bearer) so only
// the Lovable agent can trigger it. Internally uses SERVICE_ROLE_KEY to call
// the managed send helper.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendAndLog } from '../_shared/transactional-email-templates/send-and-log.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

interface Job { job_title: string; posted_ago: string }
interface Recipient { email: string; firstName?: string; jobs: Job[]; idempotencyKey?: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!apiKey || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const auth = req.headers.get('Authorization')
  const token = auth?.replace(/^Bearer\s+/i, '')
  if (token !== apiKey) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let recipients: Recipient[] = []
  try {
    const body = await req.json()
    recipients = body.recipients || []
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const db = createClient(supabaseUrl, serviceKey)
  const results: { email: string; status: number; body: string }[] = []
  for (const r of recipients) {
    try {
      const res = await sendAndLog(db, 'listing-refresh-check', r.email, {
        idempotencyKey: r.idempotencyKey || `refresh-${r.email}-${new Date().toISOString().slice(0, 10)}`,
        templateData: { firstName: r.firstName, jobs: r.jobs },
      })
      results.push({ email: r.email, status: res.sent ? 200 : 200, body: JSON.stringify(res.sent ? { success: true } : { success: false, reason: 'email_suppressed' }) })
    } catch (e) {
      results.push({ email: r.email, status: 502, body: e instanceof Error ? e.message : String(e) })
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
