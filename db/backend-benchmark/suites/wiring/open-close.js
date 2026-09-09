export const name = 'open-close'
export const layer = 'store'

export async function run({ session, store, assert }) {
  assert.ok(store, 'store created')
  assert.ok(session.db, 'db opened')
}
