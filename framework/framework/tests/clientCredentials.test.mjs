import test from 'node:test'
import assert from 'node:assert/strict'
import {
  collectAllAuthenticators,
  mergeCredentialSnapshots,
  snapshotClientCredentials
} from '../lib/runtime/clientCredentials.js'

test('collectAllAuthenticators merges top-level and per-service lists', () => {
  const a = { name: 'a' }
  const b = { name: 'b' }
  const cfg = { authenticators: [a], services: [{ name: 'foo', authenticators: [b] }] }
  const out = collectAllAuthenticators(cfg, null)
  assert.deepEqual(out, [a, b])
})

test('collectAllAuthenticators falls back to startedServices', () => {
  const a = { name: 'a' }
  const app = { startedServices: { user: { authenticators: [a] } } }
  const cfg = { services: [{ name: 'user' }] }
  const out = collectAllAuthenticators(cfg, app)
  assert.deepEqual(out, [a])
})

test('mergeCredentialSnapshots strips Key fields and merges roles', () => {
  const prepared = { session: 's1', sessionKey: 'sk', roles: ['a'] }
  const states = [{ credentials: { user: 'u1', roles: ['b'] } }]
  const merged = mergeCredentialSnapshots(prepared, states)
  assert.equal(merged.session, 's1')
  assert.equal(merged.user, 'u1')
  assert.equal(merged.sessionKey, undefined)
  assert.deepEqual(merged.roles, ['a', 'b'])
})

test('snapshotClientCredentials runs prepareCredentials and credentialsObservable snapshot', async () => {
  const steps = []
  const auth = {
    async prepareCredentials(c) {
      steps.push('prepare')
      c.session = 'sess-from-prepare'
    },
    credentialsObservable() {
      steps.push('observable')
      const observers = []
      return {
        observe(o) {
          observers.push(o)
          queueMicrotask(() => {
            const payload = { id: 'ignored', user: 'u2', roles: ['r1'] }
            for (const obs of [...observers]) {
              if (typeof obs === 'function') obs('set', payload)
              else if (obs && typeof obs.set === 'function') obs.set(payload)
            }
          })
        },
        unobserve(o) {
          const i = observers.indexOf(o)
          if (i >= 0) observers.splice(i, 1)
        }
      }
    }
  }
  const cfg = { services: [{ name: 'svc', authenticators: [auth] }] }
  const client = await snapshotClientCredentials(cfg, { sessionKey: 'abc', roles: [] }, { observableWaitMs: 3000 })
  assert.equal(client.session, 'sess-from-prepare')
  assert.equal(client.user, 'u2')
  assert.deepEqual(client.roles, ['r1'])
  assert.ok(steps.includes('prepare'))
  assert.ok(steps.includes('observable'))
})
