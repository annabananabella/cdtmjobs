// Backend-only sender for the admin SQL helpers (admin_send_email,
// admin_send_refresh_check) and the publish-notification trigger.
// Requires a service-role JWT; the browser can never call it.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendAndLog } from '../_shared/transactional-email-templates/send-and-log.ts'

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } })

function isServiceRole(h: string | null): boolean {
  const t = h?.startsWith('Bearer ') ? h.slice(7).trim() : ''
  const p = t.split('.')
  if (p.length !== 3) return false
  try {
    const s = p[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(s + '='.repeat((4 - (s.length % 4)) % 4)))?.role === 'service_role'
  } catch { return false }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!isServiceRole(req.headers.get('Authorization'))) return json({ error: 'Forbidden' }, 403)

  let templateName: string, recipientEmail: string, idempotencyKey: string | undefined
  let templateData: Record<string, unknown> = {}
  try {
    const b = await req.json()
    templateName = b.templateName || b.template_name
    recipientEmail = b.recipientEmail || b.recipient_email
    idempotencyKey = b.idempotencyKey || b.idempotency_key
    if (b.templateData && typeof b.templateData === 'object') templateData = b.templateData
  } catch { return json({ error: 'Invalid JSON in request body' }, 400) }
  if (!templateName || !recipientEmail) return json({ error: 'templateName and recipientEmail are required' }, 400)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  try {
    const r = await sendAndLog(db, templateName, recipientEmail, { templateData, idempotencyKey })
    return json(r.sent ? { success: true } : { success: false, reason: 'email_suppressed' })
  } catch (e) {
    console.error('send failed', { templateName, error: e instanceof Error ? e.message : String(e) })
    return json({ error: 'Failed to send email', details: e instanceof Error ? e.message : String(e) }, 502)
  }
})
