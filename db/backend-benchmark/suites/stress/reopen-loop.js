export const name = 'reopen-loop'
export const layer = 'store'
export const capabilities = ['durable']

export async function run({ session, store, assert }) {
  await store.put({ id: 'x', v: 0 })
  for(let i = 1; i <= 20; i++) {
    await session.closeDbOnly()
    await session.reopen()
    const again = session.createStore('data')
    const got = await again.objectGet('x')
    assert.equal(got.v, i - 1, 'value after reopen ' + i)
    await again.put({ id: 'x', v: i })
  }
}
