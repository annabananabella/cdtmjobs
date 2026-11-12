// Job extractor agent.
//
// Takes a raw message (a Slack post, a forwarded email, or text pasted by an
// admin), finds every job opening in it with AI, fills gaps from the linked job
// pages, drops duplicates, and adds the rest to the job_candidates review
// queue. Nothing is published: an admin approves candidates on /admin/review.
//
// Callers:
//   - an admin from the browser (user JWT; must pass is_admin())
//   - backend collectors (Slack/email) with the service-role key
//
// Body: { text: string, source?: "manual" | "slack" | "email", source_ref?: string }

import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  extractJobsFromMessage,
  fetchPageText,
  lovableChat,
  urlKey,
  type ExtractedJob,
  normalizeLocation,
  cleanJob,
} from '../_shared/job-extraction.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SOURCES = ['manual', 'slack', 'email'] as const
const MAX_TEXT_LENGTH = 50000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function titleKey(j: { job_title: string | null; company_name: string | null }) {
  return `${(j.company_name ?? '').trim().toLowerCase()}|${(j.job_title ?? '').trim().toLowerCase()}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const aiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!supabaseUrl || !serviceKey || !anonKey || !aiKey) {
    return json({ success: false, error: 'Server not configured' }, 500)
  }

  // ---- who is calling?
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!token) return json({ success: false, error: 'Unauthorized' }, 401)
  let reviewer: string | null = null
  if (token !== serviceKey) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    })
    const { data: isAdmin, error } = await userClient.rpc('is_admin')
    if (error || isAdmin !== true) return json({ success: false, error: 'Forbidden' }, 403)
    const { data: user } = await userClient.auth.getUser(token)
    reviewer = user.user?.email ?? null
  }

  // ---- input
  let text: string, source: typeof SOURCES[number], sourceRef: string | null, senderEmail: string | null
  try {
    const body = await req.json()
    text = typeof body.text === 'string' ? body.text.trim() : ''
    source = SOURCES.includes(body.source) ? body.source : 'manual'
    sourceRef = typeof body.source_ref === 'string' && body.source_ref.trim() ? body.source_ref.trim().slice(0, 1000) : null
    // Only trusted backend collectors may attach a sender to notify on publish.
    senderEmail = token === serviceKey && typeof body.sender_email === 'string' && /^[^\s@<>,]+@[^\s@<>,]+\.[a-z]{2,}$/i.test(body.sender_email.trim())
      ? body.sender_email.trim().toLowerCase().slice(0, 320) : null
  } catch {
    return json({ success: false, error: 'Invalid JSON' }, 400)
  }
  if (!text) return json({ success: false, error: 'text is required' }, 400)
  if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH)

  // ---- extract
  let jobs: ExtractedJob[]
  try {
    jobs = await extractJobsFromMessage(text, { chat: lovableChat(aiKey), fetchPage: fetchPageText })
  } catch (e) {
    console.error('extraction failed', e)
    return json({ success: false, error: 'AI extraction failed, please try again' }, 502)
  }

  // ---- de-duplicate against the board and the queue
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const [listings, candidates] = await Promise.all([
    db.from('job_listings').select('job_url, job_title, is_active, work_mode, created_at, companies(name)').order('created_at', { ascending: false }).limit(5000),
    db.from('job_candidates').select('job_url, job_title, company_name, status').limit(5000),
  ])
  if (listings.error || candidates.error) {
    console.error('lookup failed', listings.error ?? candidates.error)
    return json({ success: false, error: 'Database lookup failed' }, 500)
  }

  const onBoard = new Set<string>()
  const onBoardTitles = new Set<string>()
  // Latest work mode per company, used when a post doesn't state one.
  const companyWorkMode = new Map<string, string>()
  for (const l of listings.data ?? []) {
    const cn = (l as { companies?: { name?: string } | null }).companies?.name?.trim().toLowerCase()
    if (cn && l.work_mode && !companyWorkMode.has(cn)) companyWorkMode.set(cn, l.work_mode)
    // A shared link (e.g. a generic careers page) only counts together with the title.
    const k = urlKey(l.job_url)
    if (k) onBoard.add(`${k}|${(l.job_title ?? '').trim().toLowerCase()}`)
    // Same title at the same company only counts while that listing is live,
    // so a role that is re-opened later can come through again.
    const company = (l as { companies?: { name?: string } | null }).companies?.name ?? null
    if (l.is_active && company) onBoardTitles.add(titleKey({ job_title: l.job_title, company_name: company }))
  }
  const inQueue = new Set<string>()
  const inQueueTitles = new Set<string>()
  for (const c of candidates.data ?? []) {
    const k = urlKey(c.job_url)
    if (k && c.status === 'pending') inQueue.add(`${k}|${(c.job_title ?? '').trim().toLowerCase()}`)
    if (c.status === 'pending' && c.job_title && c.company_name) inQueueTitles.add(titleKey(c))
  }

  const created: { id: string; job_title: string | null; company_name: string | null }[] = []
  const skipped: { job_title: string | null; company_name: string | null; reason: string }[] = []

  // Read each job link and fill in anything the email/post left out.
  const enrichFromLink = async (job: ExtractedJob) => {
    if (!job.job_url) return
    try {
      const r = await fetch(`${supabaseUrl}/functions/v1/extract-job-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ url: job.job_url }),
        signal: AbortSignal.timeout(25000),
      })
      if (!r.ok) { console.warn('link read failed', r.status, await r.text()); return }
      const d = (await r.json())?.data ?? {}
      const fill = (k: 'job_title' | 'description' | 'location' | 'salary' | 'equity') => {
        if (!job[k] && typeof d[k] === 'string' && d[k].trim()) job[k] = d[k].trim()
      }
      // A role-specific page supplies the exact title, not a broad email category.
      if (typeof d.job_title === 'string' && d.job_title.trim()) job.job_title = d.job_title.trim();
      fill('location'); fill('salary'); fill('equity')
      job.accelerator = cleanJob({ accelerator: [job.accelerator, d.accelerator].filter(Boolean).join(',') }).accelerator
      // The job page describes the role itself, so its summary wins over the email's.
      if (typeof d.description === 'string' && d.description.trim()) job.description = d.description.trim()
      if (!job.work_mode && ['remote', 'hybrid', 'onsite'].includes(d.work_mode)) job.work_mode = d.work_mode
    } catch (e) { console.warn('link read error', e) }
  }

  for (const job of jobs) {
    await enrichFromLink(job)
    if (!job.work_mode && job.company_name) {
      const wm = companyWorkMode.get(job.company_name.trim().toLowerCase())
      if (wm) job.work_mode = wm as ExtractedJob['work_mode']
    }
    const u = urlKey(job.job_url)
    const k = u ? `${u}|${(job.job_title ?? '').trim().toLowerCase()}` : null
    const tk = job.job_title && job.company_name ? titleKey(job) : null
    if ((k && onBoard.has(k)) || (tk && onBoardTitles.has(tk))) {
      skipped.push({ job_title: job.job_title, company_name: job.company_name, reason: 'already on the board' })
      continue
    }
    if ((k && inQueue.has(k)) || (tk && inQueueTitles.has(tk))) {
      skipped.push({ job_title: job.job_title, company_name: job.company_name, reason: 'already in the review list' })
      continue
    }

    const { data, error } = await db
      .from('job_candidates')
      .insert({
        source,
        source_ref: sourceRef,
        source_text: null,
        sender_email: senderEmail,
        job_title: job.job_title,
        company_name: job.company_name,
        job_url: job.job_url,
        work_mode: job.work_mode,
        location: normalizeLocation(job.location),
        salary: job.salary,
        equity: job.equity,
        description: job.description,
        accelerator: job.accelerator,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        skipped.push({ job_title: job.job_title, company_name: job.company_name, reason: 'already in the review list' })
        continue
      }
      console.error('insert failed', error)
      skipped.push({ job_title: job.job_title, company_name: job.company_name, reason: 'could not be saved' })
      continue
    }
    if (k) inQueue.add(k)
    if (tk) inQueueTitles.add(tk)
    created.push({ id: data.id, job_title: job.job_title, company_name: job.company_name })
  }

  console.log(JSON.stringify({ event: 'extract-job-candidates', source, by: reviewer ?? 'service', found: jobs.length, created: created.length, skipped: skipped.length }))
  return json({ success: true, found: jobs.length, created, skipped })
})
