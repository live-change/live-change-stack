export const name = 'load'
export const layer = 'none'

export async function run({ backendName, assert }) {
  const { Session } = await import('../../lib/session.js')
  const session = new Session({ backendName, tmpDir: process.env.LC_BENCH_TMP + '-load' })
  assert.ok(session.backend, 'createBackend returned a backend')
  assert.ok(typeof session.backend.createDb === 'function', 'createDb exists')
  assert.ok(typeof session.backend.createStore === 'function', 'createStore exists')
}
