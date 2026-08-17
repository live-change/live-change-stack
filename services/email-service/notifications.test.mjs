/**
 * Unit tests for plain notification email content builder.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPlainEmailContent, escapeHtml } from './notificationEmailContent.js'

test('escapeHtml escapes markup', () => {
  assert.equal(escapeHtml('<b>&"'), '&lt;b&gt;&amp;&quot;')
})

test('buildPlainEmailContent uses title and message', () => {
  const content = buildPlainEmailContent({
    to: 'a@test.com',
    notificationType: 'ops_MaintenanceNeeded',
    title: 'Maintenance needed',
    message: 'Device offline',
    notification: 'n1'
  })
  assert.equal(content.to, 'a@test.com')
  assert.equal(content.subject, 'Maintenance needed')
  assert.match(content.text, /Device offline/)
  assert.match(content.html, /Maintenance needed/)
  assert.match(content.html, /n1/)
})

test('buildPlainEmailContent falls back to notificationType subject', () => {
  const content = buildPlainEmailContent({
    to: 'a@test.com',
    notificationType: 'example_TestNotification'
  })
  assert.equal(content.subject, 'Notification: example_TestNotification')
})
