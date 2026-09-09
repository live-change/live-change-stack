export const name = 'many-stores'
export const layer = 'store'

export async function run({ session, assert }) {
  const n = 200
  for(let i = 0; i < n; i++) {
    const store = session.createStore('s' + i)
    await store.put({ id: 'row', n: i })
  }
  for(let i = 0; i < n; i++) {
    const got = await session.getStore('s' + i).objectGet('row')
    assert.equal(got.n, i, 'store s' + i)
  }
}
