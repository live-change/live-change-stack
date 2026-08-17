import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWebPushPayload } from './notificationPayload.js'

test('buildWebPushPayload uses title and message', () => {
  const payload = buildWebPushPayload({
    notificationType: 'ops_MaintenanceNeeded',
    title: 'Maintenance',
    message: 'Device down',
    notification: 'n1',
    data: { task: 't1' }
  })
  assert.equal(payload.title, 'Maintenance')
  assert.equal(payload.body, 'Device down')
  assert.equal(payload.data.notification, 'n1')
  assert.equal(payload.data.task, 't1')
})

test('buildWebPushPayload falls back when title missing', () => {
  const payload = buildWebPushPayload({
    notificationType: 'example_TestNotification'
  })
  assert.match(payload.title, /example_TestNotification/)
})
