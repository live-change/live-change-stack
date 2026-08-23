import test from 'tape'
import { createDebouncedActivity } from '../lib/debouncedActivity.js'

test('debouncedActivity touch coalesces sets within debounce', (t) => {
  const activity = createDebouncedActivity(40)
  let sets = []
  activity.observable.observe((signal, value) => {
    if(signal === 'set') sets.push(JSON.parse(JSON.stringify(value)))
  })
  sets = []

  activity.touch('a')
  activity.touch('b')
  activity.touch('c')
  t.equal(sets.length, 0)

  setTimeout(() => {
    t.ok(sets.length >= 1)
    t.deepEqual(sets[0], { busy: true, lastKey: 'c', error: null })
    setTimeout(() => {
      const last = sets[sets.length - 1]
      t.deepEqual(last, { busy: false, lastKey: 'c', error: null })
      t.end()
    }, 90)
  }, 50)
})

test('debouncedActivity idle and setError flush immediately', (t) => {
  const activity = createDebouncedActivity(200)
  let latest = null
  activity.observable.observe((signal, value) => {
    if(signal === 'set') latest = value
  })

  activity.touch('k1')
  activity.idle()
  t.deepEqual(latest, { busy: false, lastKey: 'k1', error: null })

  activity.touch('k2')
  activity.setError('boom', 'k2')
  t.deepEqual(latest, { busy: false, lastKey: 'k2', error: 'boom' })
  t.end()
})
