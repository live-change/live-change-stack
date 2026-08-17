import test from 'node:test'
import assert from 'node:assert/strict'
import { webSubscriptionId } from './webId.js'

test('webSubscriptionId is stable for same endpoint', () => {
  const a = webSubscriptionId('https://push.example/abc')
  const b = webSubscriptionId('https://push.example/abc')
  assert.equal(a, b)
  assert.equal(a.length, 40)
})

test('webSubscriptionId differs for different endpoints', () => {
  const a = webSubscriptionId('https://push.example/a')
  const b = webSubscriptionId('https://push.example/b')
  assert.notEqual(a, b)
})

test('webSubscriptionId rejects empty endpoint', () => {
  assert.throws(() => webSubscriptionId(''), /endpoint_required/)
})
