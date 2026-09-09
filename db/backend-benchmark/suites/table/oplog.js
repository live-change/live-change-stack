import { waitUntil } from '../../lib/assert.js'

export const name = 'oplog'
export const layer = 'table'

export async function run({ database, assert }) {
  const users = database.createTable('users')
  await users.put({ id: '1', name: 'david' })
  await waitUntil(async () => {
    const rows = await users.opLog.rangeGet({ reverse: true, limit: 8 })
    return rows.length >= 1
  })
  const first = await users.opLog.rangeGet({ reverse: true, limit: 8 })
  assert.ok(first.length >= 1, 'put writes opLog')

  await users.put({ id: '1', name: 'david' })
  const second = await users.opLog.rangeGet({ reverse: true, limit: 8 })
  assert.equal(second.length, first.length, 'identical put skips opLog')

  await users.put({ id: '2', name: 'thomas' })
  await waitUntil(async () => {
    const rows = await users.opLog.rangeGet({ reverse: true, limit: 8 })
    return rows.length > first.length
  })
  const third = await users.opLog.rangeGet({ reverse: true, limit: 8 })
  assert.ok(third.length > second.length, 'different put appends opLog')

  const deleted = await users.opLog.rangeDelete({ gte: '', lt: '\xFF', limit: 1 }, { keysOnly: true })
  assert.ok(deleted.count >= 1, 'opLog rangeDelete keysOnly')
}
