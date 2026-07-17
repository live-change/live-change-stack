import LcDao from '@live-change/dao'
import { originalCredentialsSymbol } from '@live-change/dao'

import { waitForSignal, isAuthDebug } from './utils.js'

const SLOW_PREPARE_MS = 200

function stampAuthenticator(authenticator, serviceName) {
  if(!authenticator) return authenticator
  if(serviceName && !authenticator.serviceName) {
    authenticator.serviceName = serviceName
  }
  if(!authenticator.name) {
    authenticator.name = authenticator.serviceName
      || (authenticator.credentialsObservable ? 'credentialsObservable' : null)
      || (authenticator.prepareCredentials ? 'prepareCredentials' : null)
      || 'anonymous'
  }
  return authenticator
}

export function authenticatorLabel(authenticator) {
  const name = authenticator?.name || authenticator?.serviceName || 'anonymous'
  const kind = authenticator?.credentialsObservable
    ? 'credentialsObservable'
    : (authenticator?.prepareCredentials ? 'prepareCredentials' : 'unknown')
  return `${name}.${kind}`
}

/**
 * Collect authenticator objects the same way ApiServer.daoFactory does,
 * with optional fallback to started runtime services when config entries
 * do not carry authenticator references.
 */
export function collectAllAuthenticators(config, app = null) {
  const allAuthenticators = []
  if (config.authenticators) {
    const auth = Array.isArray(config.authenticators)
      ? config.authenticators
      : [config.authenticators]
    allAuthenticators.push(...auth.filter(a => !!a).map(a => stampAuthenticator(a, null)))
  }
  for (const service of config.services || []) {
    let list = service?.authenticators
    if ((!list || !list.length) && app?.startedServices?.[service.name]) {
      list = app.startedServices[service.name].authenticators
    }
    if (list) {
      allAuthenticators.push(...list.filter(a => !!a).map(a => stampAuthenticator(a, service.name)))
    }
  }
  return allAuthenticators
}

export async function runPrepareCredentials(allAuthenticators, credentials, config) {
  for (const authenticator of allAuthenticators) {
    if (!authenticator.prepareCredentials) continue
    const label = authenticatorLabel(authenticator)
    const startedAt = Date.now()
    try {
      await authenticator.prepareCredentials(credentials, config)
      const ms = Date.now() - startedAt
      if (ms > SLOW_PREPARE_MS || isAuthDebug()) {
        console.log('[auth] prepareCredentials done', {
          label,
          ms,
          session: credentials.session,
          ip: credentials.ip
        })
      }
    } catch (error) {
      const ms = Date.now() - startedAt
      console.error('[auth] prepareCredentials error', {
        label,
        ms,
        session: credentials.session,
        ip: credentials.ip,
        error
      })
      throw error
    }
  }
}

/**
 * Merge observable credential snapshots like LiveDao.computeCredentials:
 * spreads observer credentials, concatenates roles, strips *Key fields,
 * preserves originalCredentialsSymbol.
 */
export function mergeCredentialSnapshots(preparedCredentials, observationStates) {
  let credentials = JSON.parse(JSON.stringify(preparedCredentials))
  const originalCredentials = JSON.parse(JSON.stringify(preparedCredentials))
  const keys = Object.keys(credentials).filter(key => key.endsWith('Key'))
  for (const state of observationStates) {
    credentials = {
      ...credentials,
      ...state.credentials,
      roles: [...(credentials.roles || []), ...(state.credentials.roles || [])],
      [originalCredentialsSymbol]: originalCredentials
    }
  }
  for (const key of keys) {
    delete credentials[key]
  }
  return credentials
}

/**
 * One-shot client credentials for raw HTTP (or other non-LiveDao callers):
 * prepareCredentials + first snapshot from each credentialsObservable (then unobserve).
 * Pass the same `credentials` object reference into observables, matching LiveDao.
 */
export async function snapshotClientCredentials(config, inputCredentials, {
  app = null,
  ip,
  observableWaitMs = 5000
} = {}) {
  const credentials = {
    ...inputCredentials,
    ...(ip !== undefined ? { ip } : {}),
    roles: inputCredentials.roles ?? [],
    ignoreRemoteViews: inputCredentials.ignoreRemoteViews ?? false
  }
  const allAuthenticators = collectAllAuthenticators(config, app)
  await runPrepareCredentials(allAuthenticators, credentials, config)

  const observableAuthenticators = allAuthenticators.filter(a => a.credentialsObservable)
  const observationStates = []
  for (const authenticator of observableAuthenticators) {
    const label = authenticatorLabel(authenticator)
    const state = { credentials: {}, label }
    const result = authenticator.credentialsObservable(credentials)
    const observable = result.then ? new LcDao.ObservablePromiseProxy(result) : result
    const observer = {
      set: (data) => {
        if (data) {
          const { id, ...newCredentials } = data
          state.credentials = newCredentials
        } else {
          state.credentials = {}
        }
      }
    }
    observable.observe(observer)
    try {
      await waitForSignal(observable, observableWaitMs, () => true, {
        label,
        session: credentials.session,
        ip: credentials.ip
      })
    } finally {
      observable.unobserve(observer)
    }
    observationStates.push(state)
  }
  return mergeCredentialSnapshots(credentials, observationStates)
}
