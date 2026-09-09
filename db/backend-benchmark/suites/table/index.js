import { waitUntil } from '../../lib/assert.js'

export const name = 'index'
export const layer = 'table'

export async function run({ database, assert }) {
  const users = [
    { id: '1', name: 'david' },
    { id: '2', name: 'thomas' },
    { id: '3', name: 'george' }
  ]
  const usersTable = database.createTable('users')
  for(const user of users) await usersTable.put(user)

  const mapper = (obj) => ({ id: obj.name + '_' + obj.id, to: obj.id })
  const index = await database.createIndex('userByName', async (input, output) => {
    const map = (obj) => ({ id: obj.name + '_' + obj.id, to: obj.id })
    await input.table('users').onChange((obj, oldObj) =>
      output.change(obj && map(obj), oldObj && map(oldObj)))
  })

  const idSort = (a, b) => a.id > b.id ? 1 : (a.id < b.id ? -1 : 0)
  await waitUntil(async () => {
    const results = await index.rangeGet({ limit: 32 })
    return results.length === users.length
  })
  let results = await index.rangeGet({ limit: 32 })
  assert.deepEqual(results.slice().sort(idSort), users.map(mapper).sort(idSort), 'index after create')

  const updated = { id: '3', name: 'jack' }
  users[2] = updated
  await usersTable.put(updated)
  await waitUntil(async () => {
    const rows = await index.rangeGet({ limit: 32 })
    return rows.some(r => r.id === 'jack_3')
  })
  results = await index.rangeGet({ limit: 32 })
  assert.deepEqual(results.slice().sort(idSort), users.map(mapper).sort(idSort), 'index after rename')
}
