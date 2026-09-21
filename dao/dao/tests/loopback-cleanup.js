import test from 'tape'
import ReactiveDao, {
  LoopbackConnection,
  ObservableValue,
  ReactiveServer,
  SimpleDao
} from "../index.js"

function makeServerDao(credentials) {
  return new ReactiveDao(credentials, {
    test: {
      type: 'local',
      source: new SimpleDao({
        values: {
          item: {
            observable({ id }) {
              return new ObservableValue({ id })
            },
            get({ id }) {
              return { id }
            }
          }
        }
      })
    }
  })
}

async function setup(sessionId) {
  const server = new ReactiveServer((credentials) => makeServerDao(credentials), {
    logErrors: false
  })
  const client = new LoopbackConnection(
    { sessionId },
    server,
    { logLevel: 0, autoReconnect: false }
  )
  client.autoReconnect = false
  await client.initialize()
  const serverConn = [...server.connections.values()][0]
  const dao = new ReactiveDao({ sessionId }, {
    remoteUrl: 'dao',
    protocols: { local: null },
    defaultRoute: {
      type: 'remote',
      generator: ObservableValue
    },
    connectionSettings: { logLevel: 0 }
  })
  dao.connections.set('local:dao', client)
  return { server, client, serverConn, dao }
}

function pathFor(id) {
  return ['test', 'item', { id }]
}

function tick() {
  return new Promise(resolve => setImmediate(resolve))
}

async function flush() {
  for (let i = 0; i < 8; i++) await tick()
}

test("loopback observe/unobserve/dispose cleanup", (t) => {
  t.plan(4)

  t.test('T2.1 observe-then-unobserve clears both maps', async (t) => {
    const ctx = await setup('t21')
    const obs = ctx.dao.observable(pathFor('x'))
    const handler = () => {}
    obs.observe(handler)
    await flush()
    t.equal(ctx.client.observations.size, 1, 'observed on client')
    obs.unobserve(handler)
    await flush()
    t.equal(ctx.client.observations.size, 0, 'client map empty')
    t.equal(ctx.serverConn.observations.size, 0, 'server map empty')
    ctx.dao.dispose()
    ctx.client.dispose()
    t.end()
  })

  t.test('T2.2 observe-then-dispose clears both maps', async (t) => {
    const ctx = await setup('t22')
    const obs = ctx.dao.observable(pathFor('y'))
    const handler = () => {}
    obs.observe(handler)
    await flush()
    obs.dispose()
    await flush()
    t.equal(ctx.client.observations.size, 0, 'client map empty after dispose')
    t.equal(ctx.serverConn.observations.size, 0, 'server map empty after dispose')
    ctx.dao.dispose()
    ctx.client.dispose()
    t.end()
  })

  t.test('T2.3 many unique paths then dispose', async (t) => {
    const ctx = await setup('t23')
    const n = 40
    const held = []
    for (let i = 0; i < n; i++) {
      const obs = ctx.dao.observable(pathFor('m-' + i))
      const handler = () => {}
      obs.observe(handler)
      held.push({ obs, handler })
    }
    await flush()
    t.equal(ctx.client.observations.size, n, 'all observed')
    for (const { obs } of held) obs.dispose()
    await flush()
    t.equal(ctx.client.observations.size, 0, 'client empty')
    t.equal(ctx.serverConn.observations.size, 0, 'server empty')
    ctx.dao.dispose()
    ctx.client.dispose()
    t.end()
  })

  t.test('T2.4 dispose connection does not resurrect observations', async (t) => {
    const ctx = await setup('t24')
    const obs = ctx.dao.observable(pathFor('z'))
    obs.observe(() => {})
    await flush()
    ctx.client.dispose()
    t.equal(ctx.client.observations.size, 0, 'cleared on dispose')
    await ctx.client.initialize()
    await flush()
    t.equal(ctx.client.observations.size, 0, 'not resurrected after initialize')
    t.end()
  })
})

test.onFinish(() => process.exit(0))
