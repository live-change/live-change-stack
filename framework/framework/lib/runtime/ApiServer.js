import LcDao from "@live-change/dao"
import Dao from "./Dao.js"
import cookie from 'cookie'

import { getIp, isAuthDebug, sessionKeyPrefix } from "./utils.js"
import { collectAllAuthenticators, runPrepareCredentials, authenticatorLabel } from './clientCredentials.js'

class ApiServer {
  constructor(config, DaoConstructor = Dao) {
    this.config = config
    this.DaoConstructor = DaoConstructor

    this.reactiveServer = new LcDao.ReactiveServer(
      (credentials, connection, reactiveConnection) => {
        const ip = getIp(connection)      
        if(!credentials && this.config.fastAuth) {
          if(typeof this.config.fastAuth == 'function') {          
            credentials = this.config.fastAuth(connection)
          } else {
            const cookies = cookie.parse(connection.headers.cookie || '')            
            const sessionKey = cookies.sessionKey
            if(!sessionKey) return null // noFastAuth
            credentials = { sessionKey }
          }
        }
        return this.daoFactory(credentials, ip, reactiveConnection)
      }, config)
  }

  async daoFactory(credentialsp, ip, reactiveConnection) {
    const connectionId = reactiveConnection?.id
    const startedAt = Date.now()
    let credentials = { ...credentialsp, ip, roles: [], ignoreRemoteViews: false }
    const allAuthenticators = collectAllAuthenticators(this.config, this.config.app)
    const prepareCount = allAuthenticators.filter(a => a.prepareCredentials).length
    const observableCount = allAuthenticators.filter(a => a.credentialsObservable).length

    console.log('[auth] ApiServer daoFactory start', {
      connectionId,
      ip,
      sessionKeyPrefix: sessionKeyPrefix(credentials.sessionKey),
      prepareCount,
      observableCount,
      authenticators: allAuthenticators.map(a => authenticatorLabel(a))
    })

    const prepareStartedAt = Date.now()
    await runPrepareCredentials(allAuthenticators, credentials, this.config)
    const prepareMs = Date.now() - prepareStartedAt

    if(prepareMs > 200 || isAuthDebug()) {
      console.log('[auth] ApiServer prepareCredentials done', {
        connectionId,
        session: credentials.session,
        ip,
        prepareMs
      })
    }

    const dao = new this.DaoConstructor({
      ...this.config,
      authenticators: allAuthenticators,
      connectionId,
      credentialsObservableTimeout: this.config.credentialsObservableTimeout
    }, { ...credentials })
    try {
      await dao.start()
    } catch(error) {
      try {
        dao.dispose()
      } catch(disposeError) {
        console.error('[auth] daoFactory dispose after start failure', disposeError)
      }
      throw error
    }

    if(isAuthDebug()) {
      console.log('[auth] ApiServer daoFactory ready', {
        connectionId,
        session: credentials.session,
        ip,
        elapsedMs: Date.now() - startedAt
      })
    }

    return dao
  }

  connectionInfo() {
    return {
      type: 'apiServer',
      reactiveServer: this.reactiveServer.connectionInfo()
    }
  }

  handleConnection(connection) {
    this.reactiveServer.handleConnection(connection)
  }
}

export default ApiServer
