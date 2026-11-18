// Handles unsubscribe links in older newsletters: a valid token stops the
// newsletter for that address, records the opt-out and marks the token used.

export type CheckResult =
  | { status: 'valid' }
  | { status: 'already_unsubscribed' }
  | { status: 'invalid' }

export type ConfirmResult =
  | { status: 'unsubscribed' }
  | { status: 'already_unsubscribed' }
  | { status: 'invalid' }

export interface TokenRecord {
  email: string
  used_at: string | null
}

export interface LegacyUnsubscribeStore {
  findToken(token: string): Promise<TokenRecord | null>
  /** Mark the token used only if it is still unused; returns false if another request won. */
  markTokenUsed(token: string, at: string): Promise<boolean>
  deactivateSubscriber(email: string): Promise<void>
  recordOptOut(email: string): Promise<void>
}

/** Tokens were 32+ random hex/url-safe characters; reject anything else early. */
export function isPlausibleToken(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(token)
}

export async function checkToken(store: LegacyUnsubscribeStore, token: unknown): Promise<CheckResult> {
  if (!isPlausibleToken(token)) return { status: 'invalid' }
  const record = await store.findToken(token)
  if (!record) return { status: 'invalid' }
  return record.used_at ? { status: 'already_unsubscribed' } : { status: 'valid' }
}

export async function confirmUnsubscribe(
  store: LegacyUnsubscribeStore,
  token: unknown,
  now: () => Date = () => new Date(),
): Promise<ConfirmResult> {
  if (!isPlausibleToken(token)) return { status: 'invalid' }
  const record = await store.findToken(token)
  if (!record) return { status: 'invalid' }
  if (record.used_at) return { status: 'already_unsubscribed' }

  const email = record.email.trim().toLowerCase()
  // Stop the newsletter first, so a failure below never leaves the person
  // subscribed while the link already reads as "used".
  await store.deactivateSubscriber(email)
  await store.recordOptOut(email)
  const won = await store.markTokenUsed(token, now().toISOString())
  return won ? { status: 'unsubscribed' } : { status: 'already_unsubscribed' }
}
