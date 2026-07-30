import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getDeleteCascadeQueue,
  configureDeleteCascadeQueue,
  enqueueDeleteCascade
} from '../src/deleteCascadeQueue.js'

test('configureDeleteCascadeQueue sets concurrency', () => {
  configureDeleteCascadeQueue({ concurrency: 1 })
  assert.equal(getDeleteCascadeQueue().concurrency, 1)
  configureDeleteCascadeQueue({ concurrency: 4 })
  assert.equal(getDeleteCascadeQueue().concurrency, 4)
})

test('enqueueDeleteCascade serializes work when concurrency is 1', async () => {
  configureDeleteCascadeQueue({ concurrency: 1 })
  const order = []
  const started = []

  const job = (id, ms) => enqueueDeleteCascade(async () => {
    started.push(id)
    await new Promise(resolve => setTimeout(resolve, ms))
    order.push(id)
  })

  await Promise.all([
    job('a', 30),
    job('b', 5),
    job('c', 5)
  ])

  assert.deepEqual(started, ['a', 'b', 'c'])
  assert.deepEqual(order, ['a', 'b', 'c'])
  configureDeleteCascadeQueue({ concurrency: 4 })
})

test('enqueueDeleteCascade allows parallel work when concurrency > 1', async () => {
  configureDeleteCascadeQueue({ concurrency: 3 })
  let running = 0
  let maxRunning = 0

  const job = () => enqueueDeleteCascade(async () => {
    running++
    maxRunning = Math.max(maxRunning, running)
    await new Promise(resolve => setTimeout(resolve, 20))
    running--
  })

  await Promise.all([job(), job(), job()])
  assert.ok(maxRunning >= 2)
  configureDeleteCascadeQueue({ concurrency: 4 })
})
