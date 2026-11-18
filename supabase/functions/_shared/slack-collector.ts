// The Slack collector's main loop, with all outside services injected so it
// can be tested without Slack, the AI or the database.

import { isCandidateMessage, looksLikeJobPost, SlackError, slackToText, type SlackClient } from './slack.ts'

export interface ProcessedRecord {
  channel_id: string
  message_ts: string
  found: number
  created: number
  skipped_reason: string | null
}

export interface CollectorDeps {
  slack: SlackClient
  /** Message keys ("channel:ts") already handled in earlier runs. */
  alreadyProcessed: (channelId: string, timestamps: string[]) => Promise<Set<string>>
  markProcessed: (record: ProcessedRecord) => Promise<void>
  /** Send text to the extractor agent; returns how many jobs it found / queued. */
  extract: (text: string, sourceRef: string) => Promise<{ found: number; created: number }>
  now?: () => number
}

export interface CollectorOptions {
  /** How far back to look on every run. Older messages are never read. */
  lookbackDays?: number
  /** Stop starting new extractions after this many ms (edge functions have a time limit). */
  timeBudgetMs?: number
  /** Hard cap on AI extractions per run. */
  maxExtractions?: number
}

export interface CollectorResult {
  channels: number
  scanned: number
  extracted: number
  created: number
  skipped: number
  stoppedEarly: boolean
  errors: string[]
}

export async function collectSlackJobs(deps: CollectorDeps, opts: CollectorOptions = {}): Promise<CollectorResult> {
  const now = deps.now ?? Date.now
  const started = now()
  const lookbackDays = opts.lookbackDays ?? 7
  const budget = opts.timeBudgetMs ?? 110_000
  const maxExtractions = opts.maxExtractions ?? 40
  const oldest = ((started - lookbackDays * 86_400_000) / 1000).toFixed(6)

  const result: CollectorResult = { channels: 0, scanned: 0, extracted: 0, created: 0, skipped: 0, stoppedEarly: false, errors: [] }

  let channels
  try {
    channels = await deps.slack.myChannels()
  } catch (e) {
    result.errors.push(`listing channels: ${e instanceof Error ? e.message : String(e)}`)
    return result
  }
  result.channels = channels.length

  for (const channel of channels) {
    if (result.stoppedEarly) break
    let messages
    try {
      messages = await deps.slack.history(channel.id, oldest)
    } catch (e) {
      result.errors.push(`#${channel.name ?? channel.id}: ${e instanceof Error ? e.message : String(e)}`)
      if (e instanceof SlackError && e.code === 'rate_limited') { result.stoppedEarly = true; break }
      continue
    }

    const done = await deps.alreadyProcessed(channel.id, messages.map((m) => m.ts))

    for (const m of messages) {
      if (done.has(`${channel.id}:${m.ts}`)) continue
      result.scanned++

      const text = slackToText(m)
      let skippedReason: string | null = null
      if (!isCandidateMessage(m)) skippedReason = 'not a post'
      else if (!looksLikeJobPost(text)) skippedReason = 'no job keywords'

      if (skippedReason) {
        result.skipped++
        await deps.markProcessed({ channel_id: channel.id, message_ts: m.ts, found: 0, created: 0, skipped_reason: skippedReason })
        continue
      }

      if (result.extracted >= maxExtractions || now() - started > budget) {
        // Leave it unmarked: the next run picks it up.
        result.stoppedEarly = true
        break
      }

      const permalink = await deps.slack.permalink(channel.id, m.ts)
      const sourceRef = permalink ?? `slack:${channel.id}:${m.ts}`
      const header = `Posted in Slack channel #${channel.name ?? channel.id}`
      try {
        const r = await deps.extract(`${header}\n\n${text}`, sourceRef)
        result.extracted++
        result.created += r.created
        await deps.markProcessed({ channel_id: channel.id, message_ts: m.ts, found: r.found, created: r.created, skipped_reason: null })
      } catch (e) {
        // Not marked as processed, so it is retried on the next run.
        result.errors.push(`#${channel.name ?? channel.id} ${m.ts}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }

  return result
}
