import test from 'node:test'
import assert from 'node:assert/strict'
import { insertTimerSorted, removeTimerFromQueue } from './timerQueueCore.js'

test('insertTimerSorted inserts sorted and removeTimerFromQueue clears queue+map', () => {
  const queue = []
  const byId = new Map()
  const a = { id: 'a', timestamp: 200 }
  const b = { id: 'b', timestamp: 100 }
  const c = { id: 'c', timestamp: 150 }

  assert.deepEqual(insertTimerSorted(queue, byId, b), { inserted: true, index: 0 })
  assert.deepEqual(insertTimerSorted(queue, byId, a), { inserted: true, index: 1 })
  assert.deepEqual(insertTimerSorted(queue, byId, c), { inserted: true, index: 1 })
  assert.deepEqual(queue.map(t => t.id), ['b', 'c', 'a'])
  assert.equal(byId.size, 3)

  removeTimerFromQueue(queue, byId, 'c')
  assert.deepEqual(queue.map(t => t.id), ['b', 'a'])
  assert.equal(byId.has('c'), false)
  assert.equal(byId.has('b'), true)

  removeTimerFromQueue(queue, byId, 'b')
  removeTimerFromQueue(queue, byId, 'a')
  assert.deepEqual(queue, [])
  assert.equal(byId.size, 0)
})

test('removeTimerFromQueue does not reorder remaining timers', () => {
  const queue = [
    { id: 'a', timestamp: 10 },
    { id: 'b', timestamp: 20 },
    { id: 'c', timestamp: 30 }
  ]
  const byId = new Map(queue.map(t => [t.id, t]))
  removeTimerFromQueue(queue, byId, 'b')
  assert.deepEqual(queue.map(t => t.id), ['a', 'c'])
})

test('insertTimerSorted dedupes by id', () => {
  const queue = []
  const byId = new Map()
  const first = { id: 'x', timestamp: 50 }
  assert.equal(insertTimerSorted(queue, byId, first).inserted, true)
  assert.equal(
    insertTimerSorted(queue, byId, { id: 'x', timestamp: 10 }).inserted,
    false
  )
  assert.equal(queue.length, 1)
  assert.equal(queue[0].timestamp, 50)
})

test('removeTimerFromQueue is a no-op for missing id', () => {
  const queue = [{ id: 'a', timestamp: 1 }]
  const byId = new Map([['a', queue[0]]])
  removeTimerFromQueue(queue, byId, 'missing')
  assert.equal(queue.length, 1)
  assert.equal(byId.has('a'), true)
})
