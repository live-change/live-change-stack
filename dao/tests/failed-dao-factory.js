import test from 'tape'
import * as testServerDao from './testServerDao.js'
import ReactiveDao from "../index.js"
import LoopbackConnection from '../lib/LoopbackConnection.js'

test("time value", (t) => {
  t.plan(2)
  let sessionId = ""+Math.random()

  let server
  let client
  t.test('create connection with dao factory returning failed promise', (t) => {
    t.plan(1)
    server = new ReactiveDao.ReactiveServer(testServerDao.failedPromise)
    client = new LoopbackConnection({ sessionId }, server, {
      delay: 50
    })
    client.once('authenticationError', (err) => t.pass("authentication failed!"))
    client.initialize()
  })

  t.test('create connection with dao factory throwing exception', (t) => {
    t.plan(1)
    server = new ReactiveDao.ReactiveServer(testServerDao.failed)
    client = new LoopbackConnection({ sessionId }, server, {
      delay: 50
    })
    client.once('authenticationError', (err) => t.pass("authentication failed!"))
    client.initialize()
  })

})

test.onFinish(() => process.exit(0))
