// Sends a registered template and records the outcome in email_send_log
// ('sent' / 'suppressed' / 'failed'). The log row never decides the result.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail, type SendTemplateEmailOptions, type SendTemplateEmailResult } from './send-email.ts'

export async function logSend(
  db: SupabaseClient, templateName: string, recipient: string,
  status: 'sent' | 'suppressed' | 'failed', errorMessage?: string,
) {
  const { error } = await db.from('email_send_log').insert({
    message_id: null, template_name: templateName, recipient_email: recipient,
    status, error_message: errorMessage ? errorMessage.slice(0, 1000) : null,
  })
  if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
}

export async function sendAndLog(
  db: SupabaseClient, templateName: string, to: string, options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  try {
    const result = await sendTemplateEmail(templateName, to, options)
    await logSend(db, templateName, to, result.sent ? 'sent' : 'suppressed')
    return result
  } catch (e) {
    await logSend(db, templateName, to, 'failed', e instanceof Error ? e.message : String(e))
    throw e
  }
}
