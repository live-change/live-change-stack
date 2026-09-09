export const name = 'update'
export const layer = 'table'

export async function run({ database, assert }) {
  const users = database.createTable('users')
  await users.put({ id: '1', name: 'david', n: 1 })
  await users.update('1', [{ op: 'set', property: 'name', value: 'dave' }])
  const got = await users.objectGet('1')
  assert.equal(got.name, 'dave', 'name updated')
  assert.equal(got.n, 1, 'other field kept')
}
