import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import { waitForIndexesSettled } from '../lib/waitForIndexesSettled.js'

function mockApp(requestImpl) {
  const calls = []
  return {
    calls,
    databaseName: 'app-test',
    dao: {
      async request(path, ...args) {
        calls.push({ path, args })
        return requestImpl(path, ...args)
      }
    }
  }
}

test('waitForIndexesSettled requests database whenIndexesSettled for app.databaseName', async () => {
  const app = mockApp(async () => ({ ok: true, waited: [{ name: 'task_Task_runningRootsByName', state: 'updating' }] }))
  const result = await waitForIndexesSettled(app, {})
  assert.equal(result.ok, true)
  assert.equal(app.calls.length, 1)
  assert.deepEqual(app.calls[0].path, ['database', 'whenIndexesSettled'])
  assert.deepEqual(app.calls[0].args, ['app-test'])
})

test('waitForIndexesSettled skips dao when waitForIndexesOnStart is false', async () => {
  const app = mockApp(async () => { throw new Error('should not be called') })
  const result = await waitForIndexesSettled(app, { waitForIndexesOnStart: false })
  assert.equal(result.skipped, true)
  assert.equal(app.calls.length, 0)
})

test('waitForIndexesSettled proceeds when db-server does not implement the request', async () => {
  const app = mockApp(async () => { throw new Error('unknownRequest') })
  const result = await waitForIndexesSettled(app, {})
  assert.equal(result.skipped, true)
  assert.match(result.error, /unknownRequest/)
})

test('SsrServer prefers string settings.version then process.env.VERSION', () => {
  const src = fs.readFileSync(new URL('../lib/SsrServer.js', import.meta.url), 'utf8')
  assert.match(src, /typeof settings\.version === 'string'/)
  assert.match(src, /process\.env\.VERSION/)
})

test('setupApiServer version view ignores yargs boolean and uses VERSION env', () => {
  const src = fs.readFileSync(new URL('../lib/setupApiServer.js', import.meta.url), 'utf8')
  assert.match(src, /typeof settings\.version === 'string'/)
  assert.match(src, /process\.env\.VERSION/)
})

test('setupApiServer waits for indexes between updateServices and services.start', () => {
  const src = fs.readFileSync(new URL('../lib/setupApiServer.js', import.meta.url), 'utf8')
  const update = src.indexOf("startupTimed('updateServices'")
  const wait = src.indexOf("startupTimed('waitForIndexesSettled'")
  const start = src.indexOf("startupTimed('services.start'")
  assert.ok(update !== -1 && wait !== -1 && start !== -1, 'startupTimed calls present')
  assert.ok(update < wait, 'updateServices before waitForIndexesSettled')
  assert.ok(wait < start, 'waitForIndexesSettled before services.start')
})
