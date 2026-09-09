export const name = 'log'
export const layer = 'table'

export async function run({ database, assert }) {
  const log = database.createLog('events')
  const id1 = await log.put({ type: 'add', value: 1 })
  const id2 = await log.put({ type: 'sub', value: 2 })
  const id3 = await log.put({ type: 'add', value: 3 })
  assert.ok(id1 < id2 && id2 < id3, 'log ids increase lexicographically')
  const rows = await log.rangeGet({ limit: 16 })
  assert.equal(rows.length, 3, 'three log rows')
  assert.equal(rows[0].id, id1, 'first id')
  assert.equal(rows[2].id, id3, 'last id')
}
