// Run with: deno test supabase/functions/_shared/job-extraction.test.ts
import { assertEquals } from 'jsr:@std/assert@1'
import {
  cleanJob,
  CAREERS_PROMPT,
  extractJobsFromMessage,
  extractUrls,
  MESSAGE_PROMPT,
  normalizeUrl,
  parseJobsJson,
  urlKey,
  type ChatFn,
} from './job-extraction.ts'

Deno.test('extractUrls handles Slack link syntax and punctuation', () => {
  const text = 'We are hiring! <https://samplecorp.example/jobs/1|Apply here>. Also see https://samplecorp.example/careers.'
  assertEquals(extractUrls(text), ['https://samplecorp.example/jobs/1', 'https://samplecorp.example/careers'])
})

Deno.test('normalizeUrl strips tracking params and fragments', () => {
  assertEquals(
    normalizeUrl('samplecorp.example/jobs/1?utm_source=slack&id=5#apply'),
    'https://samplecorp.example/jobs/1?id=5',
  )
  assertEquals(normalizeUrl('javascript:alert(1)'), null)
  assertEquals(urlKey('https://SAMPLECORP.example/jobs/1/'), urlKey('https://samplecorp.example/jobs/1?utm_medium=x'))
})

Deno.test('cleanJob normalises work mode and nullish strings', () => {
  const j = cleanJob({ job_title: ' PM ', work_mode: 'On-site', salary: 'N/A', location: 'null' })
  assertEquals(j.job_title, 'PM')
  assertEquals(j.work_mode, 'onsite')
  assertEquals(j.salary, null)
  assertEquals(j.location, null)
})

Deno.test('preserves Neo membership from a job page even when email fields are complete', async () => {
  const { chat } = fakeChat(JSON.stringify({ jobs: [{ job_title: 'Commercial Operator', company_name: 'Testwerk', job_url: 'https://jobs.testwerk.example/commercial-operator', work_mode: 'onsite', location: 'Munich, Germany', description: 'Own commercial operations.' }] }), JSON.stringify({ accelerator: 'neo' }))
  let fetched = 0
  const jobs = await extractJobsFromMessage('Testwerk is hiring', { chat, fetchPage: async () => { fetched++; return 'Testwerk was selected for the Neo Accelerator.' } })
  assertEquals(fetched, 1)
  assertEquals(jobs[0].accelerator, 'neo')
})

Deno.test('preserves explicitly extracted Y Combinator membership', () => {
  assertEquals(cleanJob({ company_name: 'Example (YC S24)', accelerator: 'yc' }).accelerator, 'yc')
  assertEquals(cleanJob({ accelerator: 'unrelated' }).accelerator, null)
})

Deno.test('parseJobsJson accepts fenced JSON, bare arrays and junk', () => {
  assertEquals(parseJobsJson('```json\n{"jobs":[{"job_title":"A"}]}\n```').length, 1)
  assertEquals(parseJobsJson('[{"job_title":"A"},{"job_title":"B"}]').length, 2)
  assertEquals(parseJobsJson('Sure! {"jobs":[{"job_title":"A"}]} hope that helps').length, 1)
  assertEquals(parseJobsJson('no jobs here'), [])
  // entries without title or link are dropped
  assertEquals(parseJobsJson('{"jobs":[{"location":"Berlin"}]}'), [])
})

function fakeChat(messageReply: string, pageReply = '{}'): { chat: ChatFn; calls: string[] } {
  const calls: string[] = []
  return {
    calls,
    chat: (system) => {
      calls.push(system === MESSAGE_PROMPT ? 'message' : 'page')
      return Promise.resolve(system === MESSAGE_PROMPT ? messageReply : pageReply)
    },
  }
}

Deno.test('extracts several jobs from one message', async () => {
  const { chat } = fakeChat(JSON.stringify({
    jobs: [
      { job_title: 'Founding Engineer', company_name: 'Samplecorp', job_url: 'https://samplecorp.example/jobs/1', work_mode: 'remote', location: 'Berlin', description: 'Build things' },
      { job_title: 'Product Manager', company_name: 'Samplecorp', job_url: 'https://samplecorp.example/jobs/2', work_mode: 'hybrid', location: 'Munich', description: 'Lead product' },
    ],
  }))
  const jobs = await extractJobsFromMessage('Samplecorp is hiring: https://samplecorp.example/jobs/1 https://samplecorp.example/jobs/2', { chat })
  assertEquals(jobs.map((j) => j.job_title), ['Founding Engineer', 'Product Manager'])
})

Deno.test('Careers page resolves Engineering into two exact roles and separate links', async () => {
  const jobs = await extractJobsFromMessage('Engineering & GTM: https://demoworks.example/careers', {
    chat: async (system) => system === MESSAGE_PROMPT
      ? JSON.stringify({ jobs: [{ job_title: 'Engineering', company_name: 'Demoworks', job_url: 'https://demoworks.example/careers' }] })
      : system === CAREERS_PROMPT
        ? JSON.stringify({ jobs: [
          { job_title: 'Member of Technical Staff', job_url: 'https://demoworks.example/mts' },
          { job_title: 'Go to Market', job_url: 'https://demoworks.example/gtm' },
        ] }) : '{}',
    fetchPage: async () => 'Open roles: Member of Technical Staff https://demoworks.example/mts; Go to Market https://demoworks.example/gtm',
  });
  assertEquals(jobs.map((job) => [job.job_title, job.job_url, job.company_name]), [
    ['Member of Technical Staff', 'https://demoworks.example/mts', 'Demoworks'],
    ['Go to Market', 'https://demoworks.example/gtm', 'Demoworks'],
  ]);
});

Deno.test('fills missing details from the linked page, message wins', async () => {
  const { chat, calls } = fakeChat(
    JSON.stringify({ jobs: [{ job_title: 'Founding Engineer', job_url: 'https://samplecorp.example/jobs/1' }] }),
    JSON.stringify({ job_title: 'Senior Software Engineer', company_name: 'Samplecorp', work_mode: 'onsite', location: 'Munich', salary: '€80k' }),
  )
  const fetched: string[] = []
  const jobs = await extractJobsFromMessage('Hiring a founding engineer https://samplecorp.example/jobs/1', {
    chat,
    fetchPage: (u) => { fetched.push(u); return Promise.resolve('page text about the job '.repeat(5)) },
  })
  assertEquals(fetched, ['https://samplecorp.example/jobs/1'])
  assertEquals(calls, ['message', 'page'])
  assertEquals(jobs[0].job_title, 'Founding Engineer') // from the message
  assertEquals(jobs[0].company_name, 'Samplecorp') // from the page
  assertEquals(jobs[0].work_mode, 'onsite')
  assertEquals(jobs[0].salary, '€80k')
})

Deno.test('a bare link with no AI result still becomes a candidate', async () => {
  const { chat } = fakeChat('{"jobs": []}', JSON.stringify({ job_title: 'Designer', company_name: 'Beta' }))
  const jobs = await extractJobsFromMessage('https://beta.com/careers/designer', {
    chat,
    fetchPage: () => Promise.resolve('Designer at Beta, apply now '.repeat(5)),
  })
  assertEquals(jobs.length, 1)
  assertEquals(jobs[0].job_title, 'Designer')
  assertEquals(jobs[0].job_url, 'https://beta.com/careers/designer')
})

Deno.test('non-job messages produce nothing and fetch nothing', async () => {
  const { chat } = fakeChat('{"jobs": []}')
  let fetched = 0
  const jobs = await extractJobsFromMessage(
    'Great demo day yesterday, congrats to everyone! Photos: https://photos.example.com/album and https://example.com/recap',
    { chat, fetchPage: () => { fetched++; return Promise.resolve(null) } },
  )
  assertEquals(jobs, [])
  assertEquals(fetched, 0)
})

Deno.test('duplicate jobs within one message are merged', async () => {
  const { chat } = fakeChat(JSON.stringify({
    jobs: [
      { job_title: 'PM', job_url: 'https://samplecorp.example/jobs/2?utm_source=x', company_name: 'Samplecorp', work_mode: 'remote', location: 'Remote', description: 'x' },
      { job_title: 'pm', job_url: 'https://samplecorp.example/jobs/2', company_name: 'Samplecorp', work_mode: 'remote', location: 'Remote', description: 'x' },
    ],
  }))
  const jobs = await extractJobsFromMessage('...', { chat })
  assertEquals(jobs.length, 1)
})

Deno.test('a failing page fetch does not break extraction', async () => {
  const { chat } = fakeChat(JSON.stringify({ jobs: [{ job_title: 'Ops Lead', job_url: 'https://samplecorp.example/ops' }] }))
  const jobs = await extractJobsFromMessage('Ops Lead https://samplecorp.example/ops', {
    chat,
    fetchPage: () => Promise.reject(new Error('timeout')),
  })
  assertEquals(jobs.length, 1)
  assertEquals(jobs[0].job_title, 'Ops Lead')
})

import { normalizeLocation } from './job-extraction.ts'
Deno.test('normalizeLocation: one city per entry, plain country names', () => {
  assertEquals(normalizeLocation('SF/ Berlin'), 'San Francisco, USA; Berlin, Germany')
  assertEquals(normalizeLocation('Munich, Bavaria, DE'), 'Munich, Germany')
  assertEquals(normalizeLocation('San Francisco, United States'), 'San Francisco, USA')
  assertEquals(normalizeLocation('Palo Alto, CA'), 'Palo Alto, USA')
  assertEquals(normalizeLocation('Munich or Berlin, Germany'), 'Munich, Germany; Berlin, Germany')
})
