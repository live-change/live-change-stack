import test from 'node:test'
import assert from 'node:assert/strict'
import { ObservableValue } from '@live-change/dao'
import { wrapViewObservable } from './wrapViewObservable.js'

function testRoles(requiredRoles, clientRoles) {
  if (!requiredRoles || requiredRoles.length === 0) return true
  for (const requiredRolesOption of requiredRoles) {
    const option = Array.isArray(requiredRolesOption) ? requiredRolesOption : [requiredRolesOption]
    if (option.every(role => clientRoles.includes(role))) return true
  }
  return false
}

function createRolesObservable() {
  const observers = []
  return {
    value: undefined,
    observeCount: 0,
    unobserveCount: 0,
    observers,
    observe(fn) {
      this.observeCount++
      observers.push(fn)
      if (this.value !== undefined) {
        if (typeof fn === 'function') fn('set', this.value)
        else if (fn.set) fn.set(this.value)
      }
    },
    unobserve(fn) {
      this.unobserveCount++
      const i = observers.indexOf(fn)
      if (i >= 0) observers.splice(i, 1)
    },
    getValue() {
      return this.value
    },
    set(value) {
      this.value = value
      for (const fn of [...observers]) {
        if (typeof fn === 'function') fn('set', value)
        else if (fn.set) fn.set(value)
      }
    }
  }
}

function createValueObservable(initial) {
  const inner = new ObservableValue(initial)
  inner.disposeCount = 0
  const originalDispose = inner.dispose.bind(inner)
  inner.dispose = () => {
    inner.disposeCount++
    originalDispose()
  }
  return inner
}

function wrapWith(rolesObservable, oldObservable) {
  return wrapViewObservable({
    access: {
      accessPath: () => ['roles', 'path'],
      testRoles
    },
    app: {
      dao: {
        observable() {
          return rolesObservable
        }
      }
    },
    oldObservable,
    view: {},
    config: {
      roles: ['owner'],
      objects: () => [{ objectType: 'x', object: '1' }]
    },
    viewName: 'test view'
  })
}

const client = { session: 's1', user: 'u1', roles: [] }
const args = [{ objectType: 'x', object: '1' }, { client }]

test('T3.1 accessible-true-forwards-set', async () => {
  const roles = createRolesObservable()
  const value = createValueObservable({ ok: true })
  const observable = wrapWith(roles, () => value)
  const proxy = observable(...args)
  const got = []
  proxy.observe({
    set(v) { got.push(v) }
  })
  roles.set({ roles: ['owner'] })
  assert.deepEqual(got[got.length - 1], { ok: true })
})

test('T3.2 accessible-false-emits-error', async () => {
  const roles = createRolesObservable()
  const value = createValueObservable({ ok: true })
  const observable = wrapWith(roles, () => value)
  const proxy = observable(...args)
  let err
  proxy.observe({
    set() {},
    error(e) { err = e }
  })
  roles.set({ roles: [] })
  assert.equal(err, 'notAuthorized')
})

test('T3.3 accessible-flip-disposes-old-value', async () => {
  const roles = createRolesObservable()
  const value = createValueObservable({ ok: true })
  const observable = wrapWith(roles, () => value)
  const proxy = observable(...args)
  proxy.observe({ set() {}, error() {} })
  roles.set({ roles: ['owner'] })
  assert.equal(value.disposeCount, 0)
  roles.set({ roles: [] })
  assert.ok(value.disposeCount >= 1)
  assert.ok(value.isDisposed())
})

test('T3.4 proxy-dispose-disposes-both', async () => {
  const roles = createRolesObservable()
  const value = createValueObservable({ ok: true })
  const observable = wrapWith(roles, () => value)
  const proxy = observable(...args)
  proxy.observe({ set() {} })
  roles.set({ roles: ['owner'] })
  proxy.dispose()
  assert.equal(roles.unobserveCount, 1)
  assert.ok(value.disposeCount >= 1)
  assert.ok(value.isDisposed())
})

test('T3.5 proxy-dispose-before-value-resolve', async () => {
  const roles = createRolesObservable()
  const inner = createValueObservable({ delayed: true })
  let resolve
  const pending = new Promise(res => { resolve = res })
  const observable = wrapWith(roles, () => pending)
  const proxy = observable(...args)
  proxy.observe({ set() {}, error() {} })
  roles.set({ roles: ['owner'] })
  proxy.dispose()
  resolve(inner)
  await new Promise(r => setImmediate(r))
  await new Promise(r => setImmediate(r))
  assert.equal(inner.disposeCount, 1)
  assert.ok(inner.isDisposed())
})

test('T3.6 proxy-respawn-reobserves', async () => {
  const roles = createRolesObservable()
  const value = createValueObservable({ ok: true })
  const observable = wrapWith(roles, () => value)
  const proxy = observable(...args)
  proxy.observe({ set() {} })
  roles.set({ roles: ['owner'] })
  assert.equal(roles.observeCount, 1)
  proxy.dispose()
  proxy.respawn()
  assert.equal(roles.observeCount, 2)
})
