import test from 'node:test'
import assert from 'node:assert/strict'
import EventSourcing from '../lib/utils/EventSourcing.js'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function flush() {
  for(let i = 0; i < 8; i++) {
    await new Promise(resolve => setImmediate(resolve))
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function makeEs(request, config = {}) {
  const connection = { request }
  const es = new EventSourcing(connection, 'db', 'events', 'consumer', config)
  es.state = { id: es.consumerId, position: '0' }
  es.lastSavedPosition = '0'
  es.lastPositionSave = 0
  return es
}

test('hung put + many savePosition keeps a single inflight put', async () => {
  const gate = deferred()
  let putCalls = 0
  const es = makeEs(async (_path, _db, _table, snapshot) => {
    putCalls++
    await gate.promise
    return snapshot
  }, { saveThrottle: 1 })

  for(let i = 1; i <= 100; i++) {
    es.state.position = String(i)
    es.savePosition()
  }
  await flush()
  assert.equal(putCalls, 1)
  assert.ok(es.savePromise)
  const inflight = es.savePromise

  gate.resolve()
  await inflight
  await flush()
  es.clearSaveTimer()
})

test('release coalesces follow-up put to the last position', async () => {
  const gate = deferred()
  const positions = []
  const es = makeEs(async (_path, _db, _table, snapshot) => {
    positions.push(snapshot.position)
    await gate.promise
    return snapshot
  }, { saveThrottle: 1 })

  for(let i = 1; i <= 100; i++) {
    es.state.position = String(i)
    es.savePosition()
  }
  await flush()
  assert.equal(positions.length, 1)
  assert.equal(positions[0], '1')

  gate.resolve()
  const t0 = Date.now()
  while(positions.length < 2 && Date.now() - t0 < 1000) {
    await flush()
    await sleep(5)
  }
  assert.equal(positions.length, 2)
  assert.equal(positions[1], '100')
  assert.equal(es.lastSavedPosition, '100')
  es.clearSaveTimer()
})

test('throttle window schedules one timer, not one per event', async () => {
  let putCalls = 0
  const es = makeEs(async (_path, _db, _table, snapshot) => {
    putCalls++
    return snapshot
  }, { saveThrottle: 5000 })
  es.lastPositionSave = Date.now()

  for(let i = 1; i <= 50; i++) {
    es.state.position = String(i)
    es.savePosition()
  }
  assert.equal(putCalls, 0)
  assert.ok(es.saveTimer)
  const timer = es.saveTimer

  for(let i = 51; i <= 100; i++) {
    es.state.position = String(i)
    es.savePosition()
  }
  assert.equal(es.saveTimer, timer)
  assert.equal(putCalls, 0)

  es.clearSaveTimer()
})

test('saveState and dispose wait for hung put and persist current RAM', async () => {
  const gate = deferred()
  const positions = []
  const es = makeEs(async (_path, _db, _table, snapshot) => {
    positions.push(snapshot.position)
    await gate.promise
    return snapshot
  }, { saveThrottle: 5000 })

  es.state.position = '1'
  es.savePosition()
  await flush()
  es.state.position = '99'
  es.savePosition()
  assert.equal(positions.length, 1)

  const disposing = es.dispose()
  await flush()
  assert.equal(positions.length, 1)

  gate.resolve()
  await disposing
  assert.equal(positions.length, 2)
  assert.equal(positions[1], '99')
  assert.equal(es.lastSavedPosition, '99')
})

test('put error from savePosition does not busy-loop; saveState rethrows', async () => {
  let putCalls = 0
  const es = makeEs(async () => {
    putCalls++
    throw new Error('put failed')
  }, { saveThrottle: 5000 })

  es.state.position = '1'
  es.savePosition()
  await flush()
  await sleep(20)
  assert.equal(putCalls, 1)

  await assert.rejects(() => es.saveState(), /put failed/)
  assert.equal(putCalls, 2)

  es.clearSaveTimer()
})
