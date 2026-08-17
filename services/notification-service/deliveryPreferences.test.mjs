/**
 * Unit tests for notification delivery preference helpers (no DB).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  defaultChannelActive,
  resolveChannelActiveFromSetting
} from './deliveryPreferencesCore.js'

test('defaultChannelActive is true when no defaults configured', () => {
  assert.equal(defaultChannelActive('ops_MaintenanceNeeded', 'email', undefined), true)
  assert.equal(defaultChannelActive('ops_MaintenanceNeeded', 'email', []), true)
})

test('defaultChannelActive respects defaultSettings active false', () => {
  const defaults = [
    { notificationType: 'ops_MaintenanceNeeded', contactService: 'email', active: false }
  ]
  assert.equal(defaultChannelActive('ops_MaintenanceNeeded', 'email', defaults), false)
  assert.equal(defaultChannelActive('ops_MaintenanceNeeded', 'web', defaults), true)
  assert.equal(defaultChannelActive('other_Type', 'email', defaults), true)
})

test('resolveChannelActiveFromSetting prefers explicit setting', () => {
  assert.equal(
    resolveChannelActiveFromSetting({ active: false }, 'x', 'email', []),
    false
  )
  assert.equal(
    resolveChannelActiveFromSetting({ active: true }, 'x', 'email', [
      { notificationType: 'x', active: false }
    ]),
    true
  )
  assert.equal(
    resolveChannelActiveFromSetting(null, 'x', 'email', [
      { notificationType: 'x', active: false }
    ]),
    false
  )
})
