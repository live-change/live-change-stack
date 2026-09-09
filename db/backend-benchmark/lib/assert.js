function serialize(value) {
  try {
    return JSON.stringify(value)
  } catch(e) {
    return String(value)
  }
}

function valuesEqual(a, b) {
  if(a === b) return true
  if(a == null || b == null) return a == b
  if(Array.isArray(a) && Array.isArray(b)) {
    if(a.length !== b.length) return false
    for(let i = 0; i < a.length; i++) {
      if(!valuesEqual(a[i], b[i])) return false
    }
    return true
  }
  if(typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if(keysA.length !== keysB.length) return false
    for(const key of keysA) {
      if(!Object.prototype.hasOwnProperty.call(b, key)) return false
      if(!valuesEqual(a[key], b[key])) return false
    }
    return true
  }
  return false
}

export function createAssert() {
  const results = []

  function fail(message, extra) {
    const err = new Error(message)
    err.assertion = true
    if(extra) err.extra = extra
    throw err
  }

  function record(ok, message) {
    results.push({ ok, message })
  }

  function assert(condition, message) {
    if(!condition) fail(message || 'assertion failed')
    record(true, message)
  }

  assert.ok = assert

  assert.equal = function(actual, expected, message) {
    if(actual !== expected) {
      fail((message || 'equal') + ' expected ' + serialize(expected) + ' got ' + serialize(actual))
    }
    record(true, message)
  }

  assert.deepEqual = function(actual, expected, message) {
    if(!valuesEqual(actual, expected)) {
      fail((message || 'deepEqual') + ' expected ' + serialize(expected) + ' got ' + serialize(actual))
    }
    record(true, message)
  }

  assert.throws = async function(fn, message) {
    let threw = false
    try {
      await fn()
    } catch(e) {
      threw = true
    }
    if(!threw) fail(message || 'expected throw')
    record(true, message)
  }

  return { assert, results }
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function waitUntil(fn, timeoutMs = 5000, stepMs = 20) {
  const start = Date.now()
  let last
  while(Date.now() - start < timeoutMs) {
    last = await fn()
    if(last) return last
    await delay(stepMs)
  }
  throw new Error('timeout waiting for condition')
}

export function watchObservable(observable, snapshot) {
  let queued = 0
  let waiter = null
  const observer = () => {
    if(waiter) {
      const resolve = waiter.resolve
      clearTimeout(waiter.timer)
      waiter = null
      resolve(snapshot())
    } else {
      queued++
    }
  }
  observable.observe(observer)
  return {
    async next(timeoutMs = 5000) {
      if(queued > 0) {
        queued--
        return snapshot()
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          waiter = null
          reject(new Error('observable timeout after ' + timeoutMs + 'ms'))
        }, timeoutMs)
        waiter = { resolve, timer }
      })
    },
    pending() {
      return queued
    },
    stop() {
      if(waiter) clearTimeout(waiter.timer)
      observable.unobserve(observer)
    }
  }
}

export function padId(n, width = 6) {
  return String(n).padStart(width, '0')
}
