export const name = 'identical-put-old-object'
export const layer = 'store'

export async function run({ store, assert }) {
  const obj = { id: 'same', v: 1, nested: { a: true } }
  await store.put(obj)
  const old = await store.put({ id: 'same', v: 1, nested: { a: true } })
  assert.deepEqual(old, obj, 'identical put returns equal oldObject')
}
