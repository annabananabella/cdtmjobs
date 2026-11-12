import { EmailAPIError, sendLovableEmail } from 'npm:@lovable.dev/email-js@0.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { withoutEmDashes } from '../_shared/punctuation.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = 'cdtmjobs'
const SENDER_DOMAIN = 'notify.cdtmjobs.com'
const FROM_DOMAIN = 'cdtmjobs.com'
const SITE_URL = 'https://cdtmjobs.com'

interface JobListing {
  id: string
  job_title: string
  job_url: string
  work_mode: string
  location: string | null
  salary: string | null
  equity: string | null
  description: string | null
  cdtm_only: boolean
  company_name: string
}

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeUrl(u: unknown): string {
  const s = String(u ?? '')
  try {
    const parsed = new URL(s)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '#'
    return escapeHtml(parsed.toString())
  } catch {
    return '#'
  }
}

function renderNewsletterHtml(jobs: JobListing[], isCdtm: boolean, intro?: string): string {
  const jobRows = jobs.map(job => {
    const badges: string[] = []
    if (job.work_mode) badges.push(job.work_mode)
    if (job.location) badges.push(job.location)
    if (job.salary) badges.push(job.salary)
    if (job.cdtm_only) badges.push('CDTM Exclusive')

    return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #1a1f2e;">
          <a href="${safeUrl(job.job_url)}" style="color: #0fbf6f; font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; text-decoration: none; letter-spacing: 0.03em;">
            ${escapeHtml(job.job_title)}
          </a>
          <div style="color: #94a3b8; font-family: Inter, sans-serif; font-size: 13px; margin-top: 4px;">
            ${escapeHtml(job.company_name)}
          </div>
          ${job.description ? `<div style="color: #cbd5e1; font-family: Inter, sans-serif; font-size: 13px; margin-top: 6px; line-height: 1.5;">${escapeHtml(job.description)}</div>` : ''}
          <div style="margin-top: 8px;">
            ${badges.map(b => `<span style="display: inline-block; background: #1a1f2e; color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 3px 8px; border-radius: 4px; margin-right: 6px; margin-bottom: 4px; letter-spacing: 0.05em;">${escapeHtml(b)}</span>`).join('')}
          </div>
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0a0c0f; font-family: Inter, -apple-system, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0c0f; padding: 40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
        <!-- Header -->
        <tr><td style="padding-bottom: 32px; text-align: center;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 800; letter-spacing: 0.1em;">
            <span style="color: #f8fafc;">cdtm</span><span style="color: #0fbf6f;">jobs.</span>
          </div>
          <div style="color: #64748b; font-family: Inter, sans-serif; font-size: 12px; margin-top: 8px; letter-spacing: 0.05em;">
            ${isCdtm ? 'Community &amp; Public Listings' : 'Public Listings'}
          </div>
        </td></tr>

        <!-- Jobs -->
        <tr><td style="background: #0f1219; border-radius: 12px; padding: 24px; border: 1px solid #1a1f2e;">
          ${intro ? `<div style="color: #cbd5e1; font-family: Inter, sans-serif; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">${escapeHtml(intro)}</div>` : ''}
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #0fbf6f; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; font-weight: 600;">
            New Listings
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${jobRows}
          </table>
          ${jobs.length === 0 ? '<div style="color: #64748b; font-family: Inter, sans-serif; font-size: 14px; text-align: center; padding: 24px 0;">No new listings this period.</div>' : ''}
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding-top: 24px; text-align: center;">
          <a href="${SITE_URL}" style="display: inline-block; background-color: #0fbf6f; color: #0a0c0f; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; letter-spacing: 0.05em;">
            View All Jobs
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top: 40px; text-align: center; border-top: 1px solid #1a1f2e; margin-top: 32px;">
          <div style="color: #475569; font-family: Inter, sans-serif; font-size: 11px; line-height: 1.6;">
            You're receiving this because you subscribed to cdtmjobs newsletter.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function renderPlainText(jobs: JobListing[], intro?: string): string {
  const lines = ['cdtmjobs - New Job Listings\n']
  if (intro) lines.push(intro, '')
  for (const job of jobs) {
    lines.push(`${job.job_title} at ${job.company_name}`)
    if (job.description) lines.push(job.description)
    lines.push(`Apply: ${job.job_url}`)
    const meta = [job.work_mode, job.location, job.salary].filter(Boolean).join(' | ')
    if (meta) lines.push(meta)
    lines.push('')
  }
  if (jobs.length === 0) lines.push('No new listings this period.\n')
  lines.push(`View all jobs: ${SITE_URL}`)
  return lines.join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Auth: only service_role can trigger
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const token = authHeader.slice(7).trim()
  try {
    const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(token.split('.')[1].length / 4) * 4, '=')))
    if (claims?.role !== 'service_role') throw new Error()
  } catch {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Optional one-off intro text shown above the listings
  let intro: string | undefined
  try {
    const body = await req.json()
    if (typeof body?.intro === 'string' && body.intro.trim()) {
      intro = body.intro.trim().slice(0, 1000)
    }
  } catch { /* empty body is fine */ }

  // 1. Fetch active job listings from the last 14 days (with company name)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: allJobs, error: jobsError } = await supabase
    .from('job_listings')
    .select('id, job_title, job_url, work_mode, location, salary, equity, description, cdtm_only, company_id, companies(name)')
    .eq('is_active', true)
    .gte('created_at', twoWeeksAgo)
    .order('created_at', { ascending: false })

  if (jobsError) {
    console.error('Failed to fetch jobs', jobsError)
    return new Response(JSON.stringify({ error: 'Failed to fetch jobs' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  type JobRow = Omit<JobListing, 'company_name'> & { companies: { name: string } | null }
  // companies(name) is a many-to-one join, so PostgREST returns an object, not an array.
  const jobs: JobListing[] = ((allJobs || []) as unknown as JobRow[]).map((j) => ({
    id: j.id,
    job_title: j.job_title,
    job_url: j.job_url,
    work_mode: j.work_mode,
    location: j.location,
    salary: j.salary,
    equity: j.equity,
    description: j.description,
    cdtm_only: j.cdtm_only,
    company_name: j.companies?.name || 'Unknown',
  }))

  const publicJobs = jobs.filter(j => !j.cdtm_only)

  // 2. Fetch active subscribers
  const { data: subscribers, error: subError } = await supabase
    .from('subscribers')
    .select('id, email, is_cdtm')
    .eq('is_active', true)

  if (subError) {
    console.error('Failed to fetch subscribers', subError)
    return new Response(JSON.stringify({ error: 'Failed to fetch subscribers' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!subscribers?.length) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no_subscribers' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Suppression and unsubscribe are enforced by Lovable at send time.
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const logRow = async (email: string, status: 'sent' | 'suppressed' | 'failed', msg?: string) => {
    const { error } = await supabase.from('email_send_log').insert({
      message_id: null, template_name: 'newsletter', recipient_email: email, status,
      error_message: msg ? msg.slice(0, 1000) : null,
    })
    if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
  }
  const runKey = new Date().toISOString().slice(0, 10)
  let enqueued = 0

  for (const sub of subscribers) {
    const subscriberJobs = sub.is_cdtm ? jobs : publicJobs
    // Skip if no jobs to send (unless an intro makes it worth sending anyway)
    if (subscriberJobs.length === 0 && !intro) continue

    const message = {
      to: sub.email,
      from: `${SITE_NAME} <newsletter@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: `New Job Listings - cdtmjobs`,
      html: withoutEmDashes(renderNewsletterHtml(subscriberJobs, sub.is_cdtm, intro)),
      text: withoutEmDashes(renderPlainText(subscriberJobs, intro)),
      purpose: 'transactional' as const,
      label: 'newsletter',
      idempotency_key: `newsletter-${runKey}-${sub.id}`,
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await sendLovableEmail(message, { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') })
        await logRow(sub.email, 'sent')
        enqueued++
        break
      } catch (e) {
        if (e instanceof EmailAPIError && e.code === 'recipient_suppressed') { await logRow(sub.email, 'suppressed'); break }
        if (e instanceof EmailAPIError && e.status === 429 && attempt === 0) {
          await new Promise((r) => setTimeout(r, (e.retryAfterSeconds ?? 60) * 1000))
          continue
        }
        const msg = e instanceof Error ? e.message : String(e)
        console.error('Failed to send newsletter', { subscriber: sub.id, error: msg })
        await logRow(sub.email, 'failed', msg)
        break
      }
    }
  }

  console.log(`Newsletter sent to ${enqueued} subscribers, ${jobs.length} total jobs (${publicJobs.length} public)`)

  return new Response(
    JSON.stringify({ sent: enqueued, total_jobs: jobs.length, public_jobs: publicJobs.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
