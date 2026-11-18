// Run with: deno test supabase/functions/_shared/slack-collector.test.ts
import { assertEquals, assert } from 'jsr:@std/assert@1'
import { isCandidateMessage, looksLikeJobPost, slackClient, SlackError, slackToText, type SlackMessage } from './slack.ts'
import { collectSlackJobs, type CollectorDeps, type ProcessedRecord } from './slack-collector.ts'

// ------------------------------------------------------------ helpers

Deno.test('slackToText resolves links, mentions and previews', () => {
  const text = slackToText({
    ts: '1',
    text: 'Hey <!here>, <@U123> is hiring a PM: <https://samplecorp.example/jobs/pm|apply here> &amp; see <#C1|jobs>',
    attachments: [{ title: 'Product Manager at Samplecorp', title_link: 'https://samplecorp.example/jobs/pm', text: 'Munich, hybrid' }],
  })
  assert(text.includes('@here'))
  assert(text.includes('@someone is hiring'))
  assert(text.includes('apply here https://samplecorp.example/jobs/pm'))
  assert(text.includes('& see #jobs'))
  assert(text.includes('Product Manager at Samplecorp\nhttps://samplecorp.example/jobs/pm\nMunich, hybrid'))
})

Deno.test('looksLikeJobPost lets job posts through and drops chatter', () => {
  assert(looksLikeJobPost('We are hiring a Founding Engineer in Munich, DM me!'))
  assert(looksLikeJobPost('Wir suchen eine:n Werkstudent:in im Marketing https://x.de'))
  assert(!looksLikeJobPost('Congrats on the demo day everyone, what a night!'))
  assert(!looksLikeJobPost('thanks!'))
})

Deno.test('isCandidateMessage skips joins and thread replies', () => {
  assert(isCandidateMessage({ ts: '1', text: 'hi' }))
  assert(!isCandidateMessage({ ts: '1', subtype: 'channel_join' }))
  assert(!isCandidateMessage({ ts: '2', thread_ts: '1', text: 'reply' }))
  assert(isCandidateMessage({ ts: '1', thread_ts: '1', text: 'thread parent' }))
  assert(isCandidateMessage({ ts: '1', subtype: 'bot_message', text: 'workflow post' }))
})

Deno.test('slackClient pages through results and reports rate limits', async () => {
  const calls: string[] = []
  const fakeFetch = ((url: string) => {
    calls.push(url)
    const u = new URL(url)
    if (u.pathname.endsWith('users.conversations')) {
      const page2 = u.searchParams.get('cursor') === 'next'
      return Promise.resolve(Response.json({
        ok: true,
        channels: page2 ? [{ id: 'C2', name: 'b' }] : [{ id: 'C1', name: 'a' }],
        response_metadata: { next_cursor: page2 ? '' : 'next' },
      }))
    }
    return Promise.resolve(new Response('', { status: 429, headers: { 'Retry-After': '30' } }))
  }) as typeof fetch

  const client = slackClient('xoxb-test', fakeFetch)
  assertEquals((await client.myChannels()).map((c) => c.id), ['C1', 'C2'])
  try {
    await client.history('C1', '0')
    throw new Error('expected rate limit')
  } catch (e) {
    assert(e instanceof SlackError)
    assertEquals(e.code, 'rate_limited')
    assertEquals(e.retryAfter, 30)
  }
})

// ------------------------------------------------------------ collector

function setup(messages: Record<string, SlackMessage[]>, opts: { failExtractFor?: string } = {}) {
  const processed = new Map<string, ProcessedRecord>()
  const extracted: { text: string; ref: string }[] = []
  let clock = 0
  const deps = {
    slack: {
      myChannels: () => Promise.resolve(Object.keys(messages).map((id) => ({ id, name: id.toLowerCase() }))),
      history: (channel: string) => Promise.resolve(messages[channel] ?? []),
      permalink: (channel: string, ts: string) => Promise.resolve(`https://cdtm.slack.com/archives/${channel}/p${ts.replace('.', '')}`),
    },
    alreadyProcessed: (channel: string, tss: string[]) =>
      Promise.resolve(new Set(tss.filter((t) => processed.has(`${channel}:${t}`)).map((t) => `${channel}:${t}`))),
    markProcessed: (r: ProcessedRecord) => { processed.set(`${r.channel_id}:${r.message_ts}`, r); return Promise.resolve() },
    extract: (text: string, ref: string) => {
      clock += 1000
      if (opts.failExtractFor && text.includes(opts.failExtractFor)) return Promise.reject(new Error('extractor down'))
      extracted.push({ text, ref })
      return Promise.resolve({ found: 1, created: 1 })
    },
    now: () => clock,
  }
  return { deps: deps as unknown as CollectorDeps, processed, extracted, advance: (ms: number) => { clock += ms } }
}

const JOB = (ts: string, extra = '') => ({ ts, text: `We're hiring a Founding Engineer ${extra} https://samplecorp.example/jobs/${ts}` })

Deno.test('sends job posts to the extractor with a permalink, skips chatter', async () => {
  const { deps, processed, extracted } = setup({
    C1: [JOB('1.0001'), { ts: '1.0002', text: 'Great event yesterday, thanks all!' }, { ts: '1.0003', subtype: 'channel_join' }],
  })
  const r = await collectSlackJobs(deps)
  assertEquals(r.extracted, 1)
  assertEquals(r.skipped, 2)
  assertEquals(extracted[0].ref, 'https://cdtm.slack.com/archives/C1/p10001')
  assert(extracted[0].text.startsWith('Posted in Slack channel #c1'))
  assertEquals(processed.get('C1:1.0002')?.skipped_reason, 'no job keywords')
  assertEquals(processed.get('C1:1.0003')?.skipped_reason, 'not a post')
})

Deno.test('never processes the same message twice', async () => {
  const { deps, extracted } = setup({ C1: [JOB('1.0001')], C2: [JOB('2.0001')] })
  await collectSlackJobs(deps)
  await collectSlackJobs(deps)
  assertEquals(extracted.length, 2)
})

Deno.test('a failed extraction is retried on the next run', async () => {
  const { deps, processed, extracted } = setup({ C1: [JOB('1.0001', 'FAIL')] }, { failExtractFor: 'FAIL' })
  const r = await collectSlackJobs(deps)
  assertEquals(r.errors.length, 1)
  assertEquals(processed.has('C1:1.0001'), false)
  assertEquals(extracted.length, 0)
})

Deno.test('stops at the extraction cap and leaves the rest for next time', async () => {
  const { deps, processed } = setup({ C1: [JOB('1.1'), JOB('1.2'), JOB('1.3')] })
  const r = await collectSlackJobs(deps, { maxExtractions: 2 })
  assertEquals(r.extracted, 2)
  assertEquals(r.stoppedEarly, true)
  assertEquals(processed.has('C1:1.3'), false)
  const r2 = await collectSlackJobs(deps, { maxExtractions: 2 })
  assertEquals(r2.extracted, 1)
  assertEquals(processed.has('C1:1.3'), true)
})

Deno.test('stops when the time budget runs out', async () => {
  const { deps } = setup({ C1: [JOB('1.1'), JOB('1.2'), JOB('1.3')] })
  // each extraction advances the fake clock by 1s
  const r = await collectSlackJobs(deps, { timeBudgetMs: 1500 })
  assertEquals(r.extracted, 2)
  assertEquals(r.stoppedEarly, true)
})

Deno.test('a channel error does not stop other channels', async () => {
  const { deps, extracted } = setup({ C1: [JOB('1.1')], C2: [JOB('2.1')] })
  const history = deps.slack.history
  deps.slack.history = (c: string, o: string) => (c === 'C1' ? Promise.reject(new SlackError('not_in_channel')) : history(c, o))
  const r = await collectSlackJobs(deps)
  assertEquals(extracted.length, 1)
  assertEquals(r.errors.length, 1)
})
