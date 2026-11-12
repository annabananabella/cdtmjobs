import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  let token: string | undefined
  try {
    const body = await req.json()
    token = body.token
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  if (!token || typeof token !== 'string' || token.length < 16) {
    return json({ error: 'invalid_token' }, 400)
  }

  const { data: row, error } = await supabase
    .from('job_reactivation_tokens')
    .select('token, job_listing_id, used_at')
    .eq('token', token)
    .maybeSingle()

  if (error) return json({ error: 'lookup_failed' }, 500)
  if (!row) return json({ error: 'not_found' }, 404)

  // Fetch job for response
  const { data: job } = await supabase
    .from('job_listings')
    .select('id, job_title, is_active')
    .eq('id', row.job_listing_id)
    .maybeSingle()

  if (!job) return json({ error: 'job_not_found' }, 404)

  if (row.used_at && job.is_active) {
    return json({ success: true, already: true, job_title: job.job_title })
  }

  const { error: upErr } = await supabase
    .from('job_listings')
    .update({ is_active: true })
    .eq('id', row.job_listing_id)
  if (upErr) return json({ error: 'reactivation_failed' }, 500)

  await supabase
    .from('job_reactivation_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)

  return json({ success: true, already: false, job_title: job.job_title })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
