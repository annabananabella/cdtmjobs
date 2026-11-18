// Handles unsubscribe links in older newsletters.
//
//   GET  ?token=… from a browser       redirect to the site's /unsubscribe page
//   GET  ?token=… from the page        check a link
//   POST { token }                     confirm (from the /unsubscribe page)
//   POST ?token=… (form, One-Click)    RFC 8058 one-click from the mail client
//
// verify_jwt = false: mail clients call the one-click URL without any key.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { checkToken, confirmUnsubscribe, type LegacyUnsubscribeStore } from '../_shared/legacy-unsubscribe.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://cdtmjobs.com'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'GET' && req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server configuration error' }, 500)

  const url = new URL(req.url)
  let token: string | null = url.searchParams.get('token')
  if (req.method === 'POST') {
    const type = req.headers.get('content-type') ?? ''
    if (type.includes('application/x-www-form-urlencoded')) {
      const form = new URLSearchParams(await req.text())
      token = form.get('token') ?? token // one-click keeps the token in the URL
    } else {
      try {
        const body = await req.json()
        if (typeof body?.token === 'string') token = body.token
      } catch { /* token stays from the URL */ }
    }
  }

  // A person clicking the link in an email: show the real page instead of JSON.
  // The page's own check uses fetch(), which does not ask for text/html.
  if (req.method === 'GET' && (req.headers.get('accept') ?? '').includes('text/html')) {
    const target = new URL('/unsubscribe', SITE_URL)
    if (token) target.searchParams.set('token', token)
    return new Response(null, { status: 302, headers: { Location: target.toString() } })
  }

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const store: LegacyUnsubscribeStore = {
    async findToken(t) {
      const { data, error } = await db.from('email_unsubscribe_tokens').select('email, used_at').eq('token', t).maybeSingle()
      if (error) throw error
      return data
    },
    async markTokenUsed(t, at) {
      const { data, error } = await db
        .from('email_unsubscribe_tokens')
        .update({ used_at: at })
        .eq('token', t)
        .is('used_at', null)
        .select('token')
        .maybeSingle()
      if (error) throw error
      return !!data
    },
    async deactivateSubscriber(email) {
      const { error } = await db.from('subscribers').update({ is_active: false }).eq('email', email)
      if (error) throw error
    },
    async recordOptOut(email) {
      const { error } = await db
        .from('suppressed_emails')
        .upsert({ email, reason: 'unsubscribe' }, { onConflict: 'email' })
      if (error) throw error
    },
  }

  try {
    if (req.method === 'GET') {
      const r = await checkToken(store, token)
      if (r.status === 'invalid') return json({ error: 'Invalid or expired token' }, 404)
      return json(r.status === 'valid' ? { valid: true } : { valid: false, reason: 'already_unsubscribed' })
    }
    const r = await confirmUnsubscribe(store, token)
    if (r.status === 'invalid') return json({ error: 'Invalid or expired token' }, 404)
    console.log(JSON.stringify({ event: 'legacy-unsubscribe', result: r.status }))
    return json(r.status === 'unsubscribed' ? { success: true } : { success: false, reason: 'already_unsubscribed' })
  } catch (e) {
    console.error('legacy unsubscribe failed', e instanceof Error ? e.message : String(e))
    return json({ error: 'Failed to process unsubscribe' }, 500)
  }
})
