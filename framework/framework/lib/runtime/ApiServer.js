import LcDao from "@live-change/dao"
import Dao from "./Dao.js"
import cookie from 'cookie'

import { getIp } from "./utils.js"

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
    let credentials = { ...credentialsp, ip, roles: [] }
    const allAuthenticators = []
    if(this.config.authenticators) {
      const auth = Array.isArray(this.config.authenticators)
          ? this.config.authenticators : [this.config.authenticators]
      allAuthenticators.push(...auth.filter(a => !!a))
    }
    for(const service of this.config.services) {
      //console.log("SERIVCE AUTH", service.name, service.authenticators)
      if(service.authenticators) {
        allAuthenticators.push(...service.authenticators.filter(a => !!a))
      }
    }
    for(const authenticator of allAuthenticators) {
      if(authenticator.prepareCredentials) {
        await authenticator.prepareCredentials(credentials, this.config)
      }
    }
    const dao = new this.DaoConstructor({ ...this.config, authenticators: allAuthenticators }, { ...credentials })
    await dao.start()
    return dao
  }

  handleConnection(connection) {
    this.reactiveServer.handleConnection(connection)
  }
}

export default ApiServer
