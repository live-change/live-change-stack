export function getIp(connection) {
  let ip =
      connection.headers['x-real-ip'] ||
      connection.headers['x-forwarded-for'] ||
      connection.remoteAddress
  if(!ip) return undefined
  ip = ip.split(',')[0]
  ip = ip.split(':').slice(-1)[0] //in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
  return ip
}

export function isAuthDebug() {
  return process.env.DEBUG_AUTH === '1' || process.env.DEBUG_AUTH === 'true'
}

export function sessionKeyPrefix(sessionKey) {
  if(!sessionKey || typeof sessionKey !== 'string') return undefined
  return sessionKey.slice(0, 8) + '…'
}

export function waitForSignal(observable, timeout = 1000, filter = () => true, context = {}) {
  let observer
  let done = false
  let sawSet = false
  let lastSignal = null
  const startedAt = Date.now()
  return new Promise((resolve, reject) => {
    observer = (signal, value) => {
      if(done) return
      lastSignal = signal
      if(signal != 'set') {
        done = true
        const error = new Error('unknownSignal')
        error.code = 'unknownSignal'
        error.context = {
          ...context,
          lastSignal,
          sawSet,
          waitedMs: Date.now() - startedAt,
          value
        }
        console.error('[auth] waitForSignal unknownSignal', error.context)
        return reject(error)
      }
      sawSet = true
      if(isAuthDebug()) {
        console.log('[auth] waitForSignal set', {
          ...context,
          waitedMs: Date.now() - startedAt,
          hasValue: value != null
        })
      }
      if(filter(value)) {
        done = true
        resolve(value)
      }
    }
    setTimeout(() => {
      if(done) return
      done = true
      const error = new Error('session observable timeout')
      error.code = 'sessionObservableTimeout'
      error.context = {
        ...context,
        timeoutMs: timeout,
        waitedMs: Date.now() - startedAt,
        sawSet,
        lastSignal
      }
      console.error('[auth] waitForSignal TIMEOUT', error.context)
      reject(error)
    }, timeout)
    observable.observe(observer)
  }).finally(() => {
    observable.unobserve(observer)
  })
}
