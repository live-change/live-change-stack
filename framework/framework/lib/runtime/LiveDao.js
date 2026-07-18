import LcDao from "@live-change/dao"
import Dao from "./Dao.js"
import { originalCredentialsSymbol } from "@live-change/dao"

import { waitForSignal, isAuthDebug } from './utils.js'
import { authenticatorLabel } from './clientCredentials.js'

class LiveDao extends LcDao.DaoProxy {
  constructor(config, credentials) {
    super(null)
    this.config = config
    this.initialCredentials = credentials

    this.authenticators = []
    if(this.config.authenticators) {
      this.authenticators = this.config.authenticators.filter(a => a.credentialsObservable)
    }

    this.currentDao = null
    this.disposed = false
    this.started = false
    this.credentials = JSON.parse(JSON.stringify(this.initialCredentials))
  }

  async refreshCredentials() {
    if(!this.started) return /// waiting for start
    const newCredentials = this.computeCredentials()
    if(JSON.stringify(newCredentials) !== JSON.stringify(this.credentials)) {
      this.credentials = newCredentials
      this.buildDao()
    }
  }

  computeCredentials() {
    let credentials = JSON.parse(JSON.stringify(this.initialCredentials))
    const originalCredentials = JSON.parse(JSON.stringify(this.initialCredentials))
    const keys = Object.keys(credentials).filter(key => key.endsWith("Key"))
    for(const credentialsObserver of this.credentialsObservations) {
      credentials = {
        ...credentials,
        ...credentialsObserver.credentials,
        roles: [...credentials.roles, ...(credentialsObserver.credentials.roles || [])],
        [originalCredentialsSymbol]: originalCredentials
      }
    } 
    for(const key of keys) {
      delete credentials[key]
    }
    return credentials
  }

  async start() {
    const timeoutMs = this.config.credentialsObservableTimeout ?? 3000
    const connectionId = this.config.connectionId
    const { session, ip } = this.initialCredentials
    const labels = this.authenticators.map(a => authenticatorLabel(a))

    console.log('[auth] LiveDao auth start', {
      connectionId,
      session,
      ip,
      authenticators: labels,
      timeoutMs
    })

    const startedAt = Date.now()
    this.credentialsObservations = this.authenticators.map(authenticator => {
      const label = authenticatorLabel(authenticator)
      const result = authenticator.credentialsObservable(this.initialCredentials)
      const observable = result.then ? new LcDao.ObservablePromiseProxy(result) : result
      const observer = {
        set: (data) => {
          if(isAuthDebug()) {
            console.log('[auth] LiveDao credentials update', {
              label, connectionId, session, hasData: !!data
            })
          }
          if(data) {
            const { id, ...newCredentials } = data
            state.credentials = newCredentials
          } else {
            state.credentials = {}
          }
          this.refreshCredentials()
        }
      }
      observable.observe(observer)
      const promise = waitForSignal(observable, timeoutMs, () => true, {
        label,
        connectionId,
        session,
        ip
      })
      const state = {
        observable, observer, promise, credentials: {}, label
      }
      return state
    })

    const results = await Promise.allSettled(
      this.credentialsObservations.map(observation => observation.promise)
    )
    const failed = []
    const succeeded = []
    for(let i = 0; i < results.length; i++) {
      const result = results[i]
      const label = this.credentialsObservations[i].label
      if(result.status === 'fulfilled') {
        succeeded.push(label)
      } else {
        failed.push({
          label,
          error: result.reason,
          context: result.reason?.context
        })
      }
    }

    if(failed.length) {
      console.error('[auth] LiveDao credentialsObservable failed', {
        connectionId,
        session,
        ip,
        elapsedMs: Date.now() - startedAt,
        succeeded,
        failed: failed.map(f => ({
          label: f.label,
          code: f.error?.code,
          message: f.error?.message,
          context: f.context
        }))
      })
      throw failed[0].error
    }

    const newCredentials = this.computeCredentials()
    if(JSON.stringify(newCredentials) !== JSON.stringify(this.credentials)) {
      this.credentials = newCredentials
    }
    this.buildDao()
    this.started = true

    if(isAuthDebug()) {
      console.log('[auth] LiveDao auth ready', {
        connectionId,
        session,
        ip,
        elapsedMs: Date.now() - startedAt,
        authenticators: labels
      })
    }

    if(!this.dao) throw new Error("dao not created?!")
  }

  buildDao() {
    const oldDao = this.currentDao
    this.currentDao = new Dao(this.config, { ...this.credentials })
    this.setDao(this.currentDao)
    if(oldDao) oldDao.dispose()
  }
  dispose() {
    if(this.disposed) return
    this.disposed = true
    this.started = false
    if(this.credentialsObservations) {
      for(const observation of this.credentialsObservations) {
        observation.observable.unobserve(observation.observer)
      }
    }
    super.dispose()
  }
}

export default LiveDao
