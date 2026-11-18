import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const db = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// Records the outcome in the app's own tables (notification only — Lovable
// enforces suppression at send time). Upsert/append are redelivery-safe.
async function record(
  eventId: string, recipient: string,
  reason: 'bounce' | 'complaint' | 'unsubscribe',
  status: 'bounced' | 'complained' | 'suppressed', message: string,
) {
  const supabase = db()
  const email = recipient.toLowerCase()
  const { error: sErr } = await supabase.from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (sErr) { console.error('suppressed_emails upsert failed', { code: sErr.code, message: sErr.message, event_id: eventId }); throw sErr }
  const { error: lErr } = await supabase.from('email_send_log').insert({
    message_id: null, template_name: 'system', recipient_email: email,
    status, error_message: message, metadata: null,
  })
  if (lErr) { console.error('email_send_log insert failed', { code: lErr.code, message: lErr.message, event_id: eventId }); throw lErr }
  if (reason === 'unsubscribe') {
    // Deactivate the newsletter subscriber so they can re-subscribe later.
    const { error: uErr } = await supabase.from('subscribers').update({ is_active: false }).eq('email', email)
    if (uErr) { console.error('subscribers update failed', { code: uErr.code, message: uErr.message, event_id: eventId }); throw uErr }
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await record(event.event_id, event.data.recipient, 'bounce', 'bounced', 'Permanent bounce — email address is invalid or rejected')
    },
    'email.complaint': async (event) => {
      await record(event.event_id, event.data.recipient, 'complaint', 'complained', 'Spam complaint — recipient marked email as spam')
    },
    'email.unsubscribed': async (event) => {
      await record(event.event_id, event.data.recipient, 'unsubscribe', 'suppressed', 'Recipient unsubscribed')
    },
  },
})

Deno.serve((req) => handler(req))
