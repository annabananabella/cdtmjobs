import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendAndLog } from '../_shared/transactional-email-templates/send-and-log.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const email = (body.email || '').trim().toLowerCase()
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const is_cdtm = email.endsWith('@cdtm.de') || email.endsWith('@cdtm.com')

  // Reactivate if previously unsubscribed (service-role only RPC)
  await supabase.rpc('resubscribe_email', { subscriber_email: email })

  // Insert subscriber, ignore duplicate
  const { error: insertError } = await supabase
    .from('subscribers')
    .insert({ email })
  if (insertError && insertError.code !== '23505') {
    console.error('Failed to insert subscriber', insertError)
    return new Response(JSON.stringify({ error: 'Failed to subscribe' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Send confirmation email server-side (caller cannot pick recipient)
  try {
    const { data: jobs } = await supabase
      .rpc('get_active_jobs_for_email', { include_cdtm: is_cdtm })

    type EmailJob = { job_title: string; company_name: string; job_url: string; work_mode: string; location: string | null; salary: string | null; cdtm_only: boolean }
    const jobsForEmail = ((jobs || []) as EmailJob[]).map((j) => ({
      job_title: j.job_title,
      company_name: j.company_name,
      job_url: j.job_url,
      work_mode: j.work_mode,
      location: j.location,
      salary: j.salary,
      cdtm_only: j.cdtm_only,
    }))

    await sendAndLog(supabase, 'subscription-confirmation', email, {
      idempotencyKey: `sub-confirm-${email}-${Date.now()}`,
      templateData: { isCdtm: is_cdtm, jobs: jobsForEmail },
    })
  } catch (e) {
    console.warn('Failed to send confirmation email', e)
  }

  return new Response(JSON.stringify({ success: true, is_cdtm }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
