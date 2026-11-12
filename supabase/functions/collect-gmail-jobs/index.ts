// Gmail collector: reads new emails in the agent inbox (hello@/job@ forwards,
// Slack workflow mails, newsletters) and sends each through
// extract-job-candidates. Drafts only; nothing is published.
// Called on a schedule with the service-role key.
import { createClient } from 'npm:@supabase/supabase-js@2'

const GMAIL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1'

function decode(data: string) {
  const b = atob(data.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0)))
}
interface GmailPart { mimeType?: string; body?: { data?: string }; parts?: GmailPart[] }

function bodyText(p: GmailPart | undefined): { plain: string; html: string } {
  let plain = '', html = ''
  const walk = (x: GmailPart | undefined) => {
    if (x?.body?.data) {
      if (x.mimeType === 'text/plain') plain += decode(x.body.data)
      else if (x.mimeType === 'text/html') html += decode(x.body.data)
    }
    for (const c of x?.parts ?? []) walk(c)
  }
  walk(p)
  return { plain, html }
}
const stripHtml = (h: string) => h.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<a [^>]*href="([^"]+)"[^>]*>/gi, ' $1 ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')

Deno.serve(async (req) => {
  const url = Deno.env.get('SUPABASE_URL')!, sk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const lk = Deno.env.get('LOVABLE_API_KEY'), gk = Deno.env.get('GOOGLE_MAIL_API_KEY')
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return new Response('Forbidden', { status: 403 })
  if (token !== sk) {
    // Scheduled runs use the vault copy of the service key; accept it only if it can read a service-only table.
    const probe = await createClient(url, token, { auth: { persistSession: false } }).from('gmail_processed_messages').select('message_id').limit(1)
    if (probe.error) return new Response('Forbidden', { status: 403 })
  }
  if (!lk || !gk) return new Response('Gmail not configured', { status: 500 })
  const h = { Authorization: `Bearer ${lk}`, 'X-Connection-Api-Key': gk }
  const db = createClient(url, sk, { auth: { persistSession: false } })

  // The agent inbox's own address (never treated as a job sender).
  const profile = await fetch(`${GMAIL}/users/me/profile`, { headers: h })
  const inbox = profile.ok ? String((await profile.json()).emailAddress ?? '').toLowerCase() : ''

  const list = await fetch(`${GMAIL}/users/me/messages?maxResults=25&q=${encodeURIComponent('newer_than:3d -from:no-reply@accounts.google.com')}`, { headers: h })
  if (!list.ok) { const t = await list.text(); console.error('list', list.status, t); return new Response(t, { status: list.status }) }
  const ids: string[] = ((await list.json()).messages ?? []).map((m: { id: string }) => m.id)
  if (!ids.length) return Response.json({ processed: 0 })
  const { data: done } = await db.from('gmail_processed_messages').select('message_id').in('message_id', ids)
  const seen = new Set((done ?? []).map((d) => d.message_id))
  const results = []
  for (const id of ids.filter((i) => !seen.has(i)).slice(0, 10)) {
    const r = await fetch(`${GMAIL}/users/me/messages/${id}?format=full`, { headers: h })
    if (!r.ok) { console.error('get', id, r.status, await r.text()); continue }
    const m = await r.json()
    const subject = m.payload?.headers?.find((x: { name: string }) => x.name.toLowerCase() === 'subject')?.value ?? ''
    // Direct sender only (the From address). Cc/To and addresses inside the post are ignored.
    const from = m.payload?.headers?.find((x: { name: string }) => x.name.toLowerCase() === 'from')?.value ?? ''
    const addr = (from.match(/<([^>]+)>/)?.[1] ?? from).trim().toLowerCase()
    const sender = /^[^\s@]+@[^\s@]+$/.test(addr) && addr !== inbox && !/(cdtmjobs\.com|slack\.com|no-?reply|mailer-daemon)/.test(addr) ? addr : null
    const { plain, html } = bodyText(m.payload)
    const text = `${subject}\n\n${plain || stripHtml(html)}`.trim()
    let found = 0, created = 0
    const ex = await fetch(`${url}/functions/v1/extract-job-candidates`, {
      method: 'POST', headers: { Authorization: `Bearer ${sk}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source: 'email', source_ref: `gmail:${id}`, sender_email: sender }),
    })
    if (ex.ok) { const j = await ex.json(); found = j.found ?? 0; created = j.created?.length ?? 0 }
    else { console.error('extract', id, ex.status, await ex.text()); continue }
    await db.from('gmail_processed_messages').insert({ message_id: id, found, created })
    results.push({ id, subject, found, created })
  }
  console.log(JSON.stringify({ event: 'collect-gmail-jobs', results }))
  return Response.json({ processed: results.length, results })
})
