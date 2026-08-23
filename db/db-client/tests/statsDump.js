import test from 'tape'
import {
  accumulateDumpStats,
  dumpStatsRows,
  sortDumpStats,
  formatHumanBytes,
  formatDumpStatsTable
} from '../lib/dumpCommands.js'

test('accumulateDumpStats sums put entries and bytes', (t) => {
  const map = new Map()
  const put = {
    type: 'request',
    method: ['database', 'put'],
    parameters: ['db', 'Foo', { id: '1' }]
  }
  accumulateDumpStats(map, put, 100)
  accumulateDumpStats(map, put, 50)
  const rows = dumpStatsRows(map)
  t.equal(rows.length, 1)
  t.deepEqual(rows[0], { kind: 'table', name: 'Foo', entries: 2, bytes: 150 })
  t.end()
})

test('accumulateDumpStats separates table and log with same name', (t) => {
  const map = new Map()
  accumulateDumpStats(map, {
    type: 'request',
    method: ['database', 'put'],
    parameters: ['db', 'Same', { id: '1' }]
  }, 10)
  accumulateDumpStats(map, {
    type: 'request',
    method: ['database', 'putOldLog'],
    parameters: ['db', 'Same', { id: '2' }]
  }, 20)
  const rows = sortDumpStats(dumpStatsRows(map), 'bytes')
  t.equal(rows.length, 2)
  t.equal(rows[0].kind, 'log')
  t.equal(rows[0].bytes, 20)
  t.equal(rows[1].kind, 'table')
  t.equal(rows[1].bytes, 10)
  t.end()
})

test('accumulateDumpStats ignores createTable sync and non-request', (t) => {
  const map = new Map()
  accumulateDumpStats(map, {
    type: 'request',
    method: ['database', 'createTable'],
    parameters: ['db', 'Foo']
  }, 999)
  accumulateDumpStats(map, { type: 'sync' }, 50)
  accumulateDumpStats(map, null, 10)
  t.equal(dumpStatsRows(map).length, 0)
  t.end()
})

test('sortDumpStats by entries descending', (t) => {
  const rows = [
    { kind: 'table', name: 'A', entries: 1, bytes: 1000 },
    { kind: 'table', name: 'B', entries: 5, bytes: 10 },
    { kind: 'log', name: 'C', entries: 3, bytes: 100 }
  ]
  const byEntries = sortDumpStats(rows, 'entries')
  t.deepEqual(byEntries.map((r) => r.name), ['B', 'C', 'A'])
  const byBytes = sortDumpStats(rows, 'bytes')
  t.deepEqual(byBytes.map((r) => r.name), ['A', 'C', 'B'])
  t.end()
})

test('formatHumanBytes', (t) => {
  t.equal(formatHumanBytes(500), '500')
  t.equal(formatHumanBytes(2048), '2.00KiB')
  t.equal(formatHumanBytes(1024 * 1024), '1.00MiB')
  t.end()
})

test('formatDumpStatsTable includes TOTAL and human sizes', (t) => {
  const rows = [
    { kind: 'log', name: 'BigLog', entries: 2, bytes: 2048 },
    { kind: 'table', name: 'Small', entries: 1, bytes: 10 }
  ]
  const plain = formatDumpStatsTable(rows, { human: false })
  t.ok(plain.includes('TOTAL'))
  t.ok(plain.includes('BigLog'))
  t.ok(plain.includes('2058'))
  t.ok(plain.includes('3'))

  const human = formatDumpStatsTable(rows, { human: true })
  t.ok(human.includes('2.00KiB'))
  t.ok(human.includes('TOTAL'))
  t.end()
})
