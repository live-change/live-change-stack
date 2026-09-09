export const name = 'crud'
export const layer = 'table'

export async function run({ database, assert }) {
  const users = database.createTable('users')
  const messages = database.createTable('messages')
  await users.put({ id: '1', name: 'david' })
  await users.put({ id: '2', name: 'thomas' })
  await messages.put({ id: '1', author: '1', text: 'Hello' })

  assert.deepEqual(await users.objectGet('1'), { id: '1', name: 'david' }, 'user get')
  const range = await users.rangeGet({ gte: '1', lte: '9', limit: 16 })
  assert.equal(range.length, 2, 'two users')
  assert.equal((await messages.rangeGet({ limit: 16 })).length, 1, 'one message')
}
