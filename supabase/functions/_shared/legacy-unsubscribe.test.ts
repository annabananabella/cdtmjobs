// Run with: deno test supabase/functions/_shared/legacy-unsubscribe.test.ts
import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import { checkToken, confirmUnsubscribe, isPlausibleToken, type LegacyUnsubscribeStore } from './legacy-unsubscribe.ts'

const TOKEN = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'

function fakeStore(tokens: Record<string, { email: string; used_at: string | null }>, opts: { failDeactivate?: boolean } = {}) {
  const deactivated: string[] = []
  const optedOut: string[] = []
  const store: LegacyUnsubscribeStore = {
    findToken: (t) => Promise.resolve(tokens[t] ? { ...tokens[t] } : null),
    markTokenUsed: (t, at) => {
      if (!tokens[t] || tokens[t].used_at) return Promise.resolve(false)
      tokens[t].used_at = at
      return Promise.resolve(true)
    },
    deactivateSubscriber: (email) => {
      if (opts.failDeactivate) return Promise.reject(new Error('db down'))
      deactivated.push(email)
      return Promise.resolve()
    },
    recordOptOut: (email) => { optedOut.push(email); return Promise.resolve() },
  }
  return { store, tokens, deactivated, optedOut }
}

Deno.test('rejects missing or malformed tokens without touching the database', async () => {
  const { store } = fakeStore({})
  for (const bad of [null, undefined, '', 'short', 'has spaces in it here', "x'; drop table--", 42]) {
    assertEquals(isPlausibleToken(bad), false)
    assertEquals(await checkToken(store, bad), { status: 'invalid' })
    assertEquals(await confirmUnsubscribe(store, bad), { status: 'invalid' })
  }
})

Deno.test('unknown token is invalid', async () => {
  const { store } = fakeStore({})
  assertEquals(await checkToken(store, TOKEN), { status: 'invalid' })
  assertEquals(await confirmUnsubscribe(store, TOKEN), { status: 'invalid' })
})

Deno.test('valid token: check, then confirm stops the newsletter and records the opt-out', async () => {
  const { store, tokens, deactivated, optedOut } = fakeStore({ [TOKEN]: { email: ' Reader@Example.com ', used_at: null } })
  assertEquals(await checkToken(store, TOKEN), { status: 'valid' })
  const r = await confirmUnsubscribe(store, TOKEN, () => new Date('2026-11-18T10:00:00Z'))
  assertEquals(r, { status: 'unsubscribed' })
  assertEquals(deactivated, ['reader@example.com'])
  assertEquals(optedOut, ['reader@example.com'])
  assertEquals(tokens[TOKEN].used_at, '2026-11-18T10:00:00.000Z')
})

Deno.test('using a link twice is safe and reports already unsubscribed', async () => {
  const { store, deactivated } = fakeStore({ [TOKEN]: { email: 'reader@example.com', used_at: null } })
  await confirmUnsubscribe(store, TOKEN)
  assertEquals(await checkToken(store, TOKEN), { status: 'already_unsubscribed' })
  assertEquals(await confirmUnsubscribe(store, TOKEN), { status: 'already_unsubscribed' })
  assertEquals(deactivated.length, 1)
})

Deno.test('if stopping the newsletter fails, the link stays usable for a retry', async () => {
  const { store, tokens } = fakeStore({ [TOKEN]: { email: 'reader@example.com', used_at: null } }, { failDeactivate: true })
  await assertRejects(() => confirmUnsubscribe(store, TOKEN))
  assertEquals(tokens[TOKEN].used_at, null)
})
