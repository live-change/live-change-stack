import test from 'tape'
import { formatCursor, formatIndexProgress, MAX_ID_LENGTH } from '../lib/indexProgress.js'

function fakeIndex({ phase, sources, lastKey }) {
  return {
    lastPhase: phase,
    configObservable: {
      value: {
        sources: sources || []
      }
    },
    activity: {
      observable: {
        value: { busy: true, lastKey: lastKey ?? null, error: null }
      }
    }
  }
}

test('formatCursor reads an oplog timestamp as a date', t => {
  const key = '0000017632000000:000042'
  const formatted = formatCursor(key)
  t.equal(formatted.kind, 'oplog')
  t.equal(formatted.at, new Date(Number('0000017632000000')).toISOString())
  t.equal(formatted.key, key)
  t.end()
})

test('formatCursor keeps a plain id', t => {
  const formatted = formatCursor('user_User:abc')
  t.equal(formatted.kind, 'id')
  t.equal(formatted.id, 'user_User:abc')
  t.end()
})

test('formatCursor truncates a long id', t => {
  const id = 'x'.repeat(MAX_ID_LENGTH + 40)
  const formatted = formatCursor(id)
  t.equal(formatted.kind, 'id')
  t.equal(formatted.id.length, MAX_ID_LENGTH)
  t.ok(formatted.id.endsWith('...'))
  t.end()
})

test('formatIndexProgress lists sources and hides the cursor while creating', t => {
  const progress = formatIndexProgress(fakeIndex({
    phase: 'creating',
    sources: [
      { type: 'table', name: 'user_User' },
      { type: 'table', name: 'accessControl_AccessParent' }
    ],
    lastKey: '0000017632000000:000001'
  }))
  t.equal(progress.phase, 'creating')
  t.equal(progress.cursor, null)
  t.deepEqual(progress.sources, [
    'table user_User',
    'table accessControl_AccessParent'
  ])
  t.end()
})

test('formatIndexProgress keeps the oplog key while updating', t => {
  const key = '0000017632000000:000042'
  const progress = formatIndexProgress(fakeIndex({
    phase: 'updating',
    sources: [{ type: 'table', name: 'user_User' }],
    lastKey: key
  }))
  t.equal(progress.phase, 'updating')
  t.equal(progress.cursor, key)
  t.deepEqual(progress.sources, ['table user_User'])
  t.equal(formatCursor(progress.cursor).at, new Date(Number('0000017632000000')).toISOString())
  t.end()
})
