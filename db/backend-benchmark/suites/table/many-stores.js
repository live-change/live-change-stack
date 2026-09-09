export const name = 'many-stores'
export const layer = 'table'

export async function run({ database, assert }) {
  const n = 40
  for(let i = 0; i < n; i++) {
    const table = database.createTable('t' + i)
    await table.put({ id: 'row', n: i })
  }
  for(let i = 0; i < n; i++) {
    const got = await database.table('t' + i).objectGet('row')
    assert.equal(got.n, i, 'table t' + i)
  }
}
