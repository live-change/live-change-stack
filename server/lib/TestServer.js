import path from 'path'
import http from 'http'
import express from 'express'

import App from '@live-change/framework'
const app = App.app()

import { hashCode, encodeNumber, uidGenerator } from '@live-change/uid'
import setupApiServer from './setupApiServer.js'
import setupApiSockJs from './setupApiSockJs.js'
import setupApiWs from './setupApiWs.js'
import setupDbServer from './setupDbServer.js'
import createLoopbackDao from './createLoopbackDao.js'
import SsrServer from './SsrServer.js'
import fs from "fs";

class TestServer {
  constructor(config) {
    this.config = config
  }

  async start() {
    this.expressApp = express()

    const manifest = (dev || argv.spa)
        ? null
        : JSON.parse(fs.readFileSync((path.resolve(ssrRoot, 'dist/client/.vite/ssr-manifest.json'))))

    app.instanceId = encodeNumber(hashCode(
      `app${process.pid}${require("os").hostname()} ${process.cwd()}/${process.argv.join(' ')}`))
    app.uidGenerator = uidGenerator(app.instanceId, 1, '[]')
    this.dbServer = await setupDbServer({ dbBackend: 'mem' })
    const loopbackDao = await createLoopbackDao('local', () => this.dbServer.createDao('local'))
    app.dao = loopbackDao
    app.databaseName = 'test'

    await app.dao.request(['database', 'createDatabase'], app.databaseName, { }).catch(err => 'exists')

    this.apiServer = await setupApiServer({
      withServices: true,
      updateServices: true,
      ...this.config
    }, this.dbServer)

    this.ssrServer = new SsrServer(this.expressApp, this.manifest, {
      dev: this.dev,
      root: this.config.ssrRoot,
      daoFactory: async (credentials, ip) => {
        return await this.createDao(credentials, ip)
      },
      ...this.config
    })

    await this.ssrServer.start()

    this.expressServer = http.createServer(this.expressApp)
    this.services = this.apiServer.services.getServicesObject()

    this.wsServer = await setupApiWs(this.expressServer, this.apiServer)
    this.sockJsServer = await setupApiSockJs(this.expressServer, this.apiServer)

    await new Promise((resolve, reject) => {
      this.httpServer = this.expressServer.listen(this.config.port || 0, () => {
        this.port = this.expressServer.address().port
        this.url = `http://localhost:${this.expressServer.address().port}`
        process.env.SSR_PORT = this.port
        resolve()
      })
    })
  }
  async createDao(credentials, ip) {
    return await createLoopbackDao(credentials, () => this.apiServer.daoFactory(credentials, ip))
  }

  async dispose() {
    try {
      console.log("CLOSE HTTP!")
      await this.httpServer.close()
      console.log("CLOSE APP")
      await app.close()
      console.log("CLOSE DB!")
      await this.dbServer.close()
      console.log("CLOSE SSR!")
      await this.ssrServer.close()
      console.log("CLOSED!")
      //this.wsServer.close()
      //this.sockJsServer.close()
    } catch(error) {
      console.error("CLOSE ERROR", error)
    }
  }
}

export default TestServer
