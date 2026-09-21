import test from 'tape'
import ReactiveDao from "../index.js"

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function tick() {
  return new Promise(resolve => setImmediate(resolve))
}

test("ObservablePromiseProxy contract", (t) => {
  t.plan(6)

  t.test('T1.1 observe-before-resolve forwards set', async (t) => {
    const inner = new ReactiveDao.ObservableValue(42)
    const d = deferred()
    const proxy = new ReactiveDao.ObservablePromiseProxy(d.promise)
    let got
    proxy.observe({
      set(value) { got = value }
    })
    d.resolve(inner)
    await tick()
    t.equal(got, 42, "observer received inner value")
    t.end()
  })

  t.test('T1.2 unobserve-before-resolve does not leave inner observed', async (t) => {
    const inner = new ReactiveDao.ObservableValue(7)
    const d = deferred()
    const proxy = new ReactiveDao.ObservablePromiseProxy(d.promise)
    const observer = { set() {} }
    proxy.observe(observer)
    proxy.unobserve(observer)
    d.resolve(inner)
    await tick()
    t.equal(inner.observers.length, 0, "inner has no observers")
    t.end()
  })

  t.test('T1.3 dispose-before-resolve disposes inner', async (t) => {
    const inner = new ReactiveDao.ObservableValue(9)
    const d = deferred()
    const proxy = new ReactiveDao.ObservablePromiseProxy(d.promise)
    proxy.observe({ set() {} })
    proxy.dispose()
    d.resolve(inner)
    await tick()
    t.ok(inner.isDisposed(), "inner disposed after late resolve")
    t.end()
  })

  t.test('T1.4 observe-after-resolve fires set immediately', async (t) => {
    const inner = new ReactiveDao.ObservableValue(13)
    const d = deferred()
    const proxy = new ReactiveDao.ObservablePromiseProxy(d.promise)
    d.resolve(inner)
    await tick()
    let got
    proxy.observe({
      set(value) { got = value }
    })
    t.equal(got, 13, "set fired on observe after resolve")
    t.end()
  })

  t.test('T1.5 error-propagation', async (t) => {
    const d = deferred()
    const proxy = new ReactiveDao.ObservablePromiseProxy(d.promise)
    let err
    proxy.observe({
      error(e) { err = e }
    })
    d.reject('boom')
    await tick()
    t.equal(err, 'boom', "error forwarded")
    t.end()
  })

  t.test('T1.6 respawn-after-dispose still delivers set', async (t) => {
    const inner = new ReactiveDao.ObservableValue(21)
    const d = deferred()
    const proxy = new ReactiveDao.ObservablePromiseProxy(d.promise)
    d.resolve(inner)
    await tick()
    proxy.dispose()
    proxy.respawn()
    let got
    proxy.observe({
      set(value) { got = value }
    })
    inner.set(21)
    t.equal(got, 21, "respawn + observe delivers value")
    t.end()
  })
})

test.onFinish(() => process.exit(0))
