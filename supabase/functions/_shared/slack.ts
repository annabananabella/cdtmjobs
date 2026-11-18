// Helpers for the Slack collector. Pure functions + a small Slack Web API
// client with an injectable fetch, so everything can be unit-tested offline.

export interface SlackMessage {
  ts: string
  text?: string
  user?: string
  bot_id?: string
  subtype?: string
  thread_ts?: string
  attachments?: { title?: string; title_link?: string; text?: string; fallback?: string; from_url?: string }[]
  files?: { name?: string; title?: string; permalink?: string }[]
}

export interface SlackChannel {
  id: string
  name?: string
  is_archived?: boolean
}

// Message types that are never job posts (joins, topic changes, etc.).
const IGNORED_SUBTYPES = new Set([
  'channel_join', 'channel_leave', 'channel_topic', 'channel_purpose', 'channel_name',
  'channel_archive', 'channel_unarchive', 'group_join', 'group_leave', 'pinned_item',
  'unpinned_item', 'reminder_add', 'bot_add', 'bot_remove', 'tombstone', 'message_deleted',
])

/** Turn Slack markup into plain text the extractor can read. */
export function slackToText(m: SlackMessage): string {
  let text = (m.text ?? '')
    // <https://x.com|label> -> "label https://x.com", <https://x.com> -> "https://x.com"
    .replace(/<((?:https?|mailto):[^|>]+)\|([^>]+)>/g, '$2 $1')
    .replace(/<((?:https?|mailto):[^>]+)>/g, '$1')
    // <@U123> / <#C123|jobs> / <!here>
    .replace(/<@[A-Z0-9]+(?:\|([^>]+))?>/g, (_m, name) => (name ? `@${name}` : '@someone'))
    .replace(/<#[A-Z0-9]+(?:\|([^>]+))?>/g, (_m, name) => (name ? `#${name}` : '#channel'))
    .replace(/<!(here|channel|everyone)[^>]*>/g, '@$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

  // Link previews and shared messages often carry the actual job details.
  const extras: string[] = []
  for (const a of m.attachments ?? []) {
    const parts = [a.title, a.title_link ?? a.from_url, a.text ?? a.fallback].filter(Boolean)
    if (parts.length) extras.push(parts.join('\n'))
  }
  for (const f of m.files ?? []) {
    const parts = [f.title ?? f.name, f.permalink].filter(Boolean)
    if (parts.length) extras.push(`Attached file: ${parts.join(' ')}`)
  }
  if (extras.length) text += `\n\n${extras.join('\n\n')}`
  return text.trim()
}

const JOB_WORDS = new RegExp(
  [
    'hiring', 'we\'re looking', 'we are looking', 'looking for', 'job', 'jobs', 'role', 'roles', 'position',
    'opening', 'vacancy', 'apply', 'application', 'join (?:our|the) team', 'intern', 'internship',
    'working student', 'werkstudent', 'praktikum', 'praktikant', 'stelle', 'wir suchen', 'founding',
    'engineer', 'developer', 'designer', 'manager', 'associate', 'analyst', 'full-?time', 'part-?time',
    'remote', 'hybrid', 'careers?', 'recruit', 'cofounder', 'co-founder',
  ].join('|'),
  'i',
)

/**
 * Cheap pre-filter so the AI only reads messages that might be job posts.
 * It errs on the side of letting messages through: the extractor makes the
 * real decision.
 */
export function looksLikeJobPost(text: string): boolean {
  const t = text.trim()
  if (t.length < 25) return false
  return JOB_WORDS.test(t)
}

/** Messages the collector should consider (top-level human or workflow posts). */
export function isCandidateMessage(m: SlackMessage): boolean {
  if (m.subtype && IGNORED_SUBTYPES.has(m.subtype)) return false
  // Replies inside a thread are skipped; the thread's first message is used.
  if (m.thread_ts && m.thread_ts !== m.ts) return false
  return true
}

// ---------------------------------------------------------------- client

export class SlackError extends Error {
  constructor(public code: string, public retryAfter?: number) {
    super(`Slack API error: ${code}`)
  }
}

export type FetchFn = typeof fetch

export function slackClient(token: string, fetchFn: FetchFn = fetch) {
  async function call<T>(method: string, params: Record<string, string | number | undefined>): Promise<T> {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v !== undefined) qs.set(k, String(v))
    const res = await fetchFn(`https://slack.com/api/${method}?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 429) {
      throw new SlackError('rate_limited', Number(res.headers.get('Retry-After') ?? '60'))
    }
    const data = await res.json().catch(() => ({ ok: false, error: `http_${res.status}` }))
    if (!data.ok) throw new SlackError(data.error ?? `http_${res.status}`)
    return data as T
  }

  return {
    /** Channels the bot has been added to. */
    async myChannels(): Promise<SlackChannel[]> {
      const out: SlackChannel[] = []
      let cursor: string | undefined
      do {
        const r = await call<{ channels: SlackChannel[]; response_metadata?: { next_cursor?: string } }>(
          'users.conversations',
          { types: 'public_channel,private_channel', exclude_archived: 'true', limit: 200, cursor },
        )
        out.push(...r.channels)
        cursor = r.response_metadata?.next_cursor || undefined
      } while (cursor && out.length < 1000)
      return out
    },

    /** Messages in a channel newer than `oldest` (Slack timestamp), oldest first. */
    async history(channel: string, oldest: string, max = 200): Promise<SlackMessage[]> {
      const out: SlackMessage[] = []
      let cursor: string | undefined
      do {
        const r = await call<{ messages: SlackMessage[]; response_metadata?: { next_cursor?: string } }>(
          'conversations.history',
          { channel, oldest, limit: 100, cursor },
        )
        out.push(...r.messages)
        cursor = r.response_metadata?.next_cursor || undefined
      } while (cursor && out.length < max)
      return out.sort((a, b) => Number(a.ts) - Number(b.ts))
    },

    async permalink(channel: string, ts: string): Promise<string | null> {
      try {
        const r = await call<{ permalink: string }>('chat.getPermalink', { channel, message_ts: ts })
        return r.permalink
      } catch {
        return null
      }
    },
  }
}

export type SlackClient = ReturnType<typeof slackClient>
