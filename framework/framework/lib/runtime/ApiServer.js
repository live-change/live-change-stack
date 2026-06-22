import LcDao from "@live-change/dao"
import Dao from "./Dao.js"
import cookie from 'cookie'

import { getIp } from "./utils.js"
import { collectAllAuthenticators, runPrepareCredentials } from './clientCredentials.js'

class ApiServer {
  constructor(config, DaoConstructor = Dao) {
    this.config = config
    this.DaoConstructor = DaoConstructor

    this.reactiveServer = new LcDao.ReactiveServer(
      (credentials, connection) => {
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
        return this.daoFactory(credentials, ip)
      }, config)
  }

  async daoFactory(credentialsp, ip) {
    let credentials = { ...credentialsp, ip, roles: [], ignoreRemoteViews: false }
    const allAuthenticators = collectAllAuthenticators(this.config, this.config.app)
    await runPrepareCredentials(allAuthenticators, credentials, this.config)
    const dao = new this.DaoConstructor({ ...this.config, authenticators: allAuthenticators }, { ...credentials })
    await dao.start()
    return dao
  }

  handleConnection(connection) {
    this.reactiveServer.handleConnection(connection)
  }
}

export default ApiServer
