import test from 'tape'
import * as testServerDao from './testServerDao.js'
import ReactiveDao from "../index.js"
import LoopbackConnection from '../lib/LoopbackConnection.js'

test("loopback connection", (t) => {
  t.plan(4)
  let sessionId = ""+Math.random()

  let server
  t.test('create server', (t) => {
    t.plan(1)

    server = new ReactiveDao.ReactiveServer(testServerDao.instant)
    t.assert(!!server, "server generated")
  })

  let client
  t.test('connect to server', (t) => {
    t.plan(1)
    client = new LoopbackConnection({ sessionId }, server, {
      onConnect: () => t.pass("connected"),
      delay: 50
    })
    client.initialize()
  })

  t.test('get session id', (t) => {
    return client.get(['test','sessionId']).then(
      serverSessionId => t.equals(serverSessionId, sessionId, "Session ID equals")
    )
  })

  t.test('disconnect from server', (t) => {
    t.plan(1)
    client.settings.onDisconnect = () => {
      t.pass("disconnected")
      t.end()
    }
    client.dispose()
  })

})

test.onFinish(() => process.exit(0))
