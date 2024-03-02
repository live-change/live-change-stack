import test from 'tape'
import * as testServerDao from './testServerDao.js'
import ReactiveDao from "../index.js"
import LoopbackConnection from '../lib/LoopbackConnection.js'

test("time value", (t) => {
  t.plan(3)
  let sessionId = ""+Math.random()

  let server
  let client
  t.test('create connection', (t) => {
    t.plan(1)
    server = new ReactiveDao.ReactiveServer(testServerDao.promised)
    client = new LoopbackConnection({ sessionId }, server, {
      onConnect: () => t.pass("connected"),
      delay: 50
    })
    client.initialize()
  })

  let errorObservable, errorObserver
  t.test('observe server instaError value', (t) => {
    t.plan(1)

    errorObservable = client.observable(['test','instaError'],ReactiveDao.ObservableValue)
    errorObserver = {}
    errorObservable.catch((error) => {
      t.pass("caught error")
    })
    errorObservable.observe(errorObserver)
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
