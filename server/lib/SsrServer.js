import cookie from 'cookie'
import path from 'path'
import crypto from 'crypto'
import os from 'os'
import expressStaticGzip from "express-static-gzip"

import serverDao from './serverDao.js'
import { hashCode, encodeNumber, uidGenerator } from '@live-change/uid'
import getIp from './getIp.js'

import Renderer from './Renderer.js'

import { fbRedirect } from './fbRedirect.js'


class SsrServer {
  constructor(express, manifest, settings) {
    this.manifest = manifest
    this.settings = settings

    this.version = settings.version || 'unknown'
    this.express = express
    if(!this.settings.spa || this.settings.dev) {
      this.renderer = new Renderer(manifest, settings)
    }

    this.instanceId = encodeNumber(hashCode(
      `ssr${process.pid}${os.hostname()} ${process.cwd()}/${process.argv.join(' ')}`))
    this.uidGenerator = uidGenerator(this.instanceId, 1, this.settings.uidBorders)

    this.root = this.settings.root || process.cwd()
  }

  async start() {
    if(this.renderer) {
      await this.renderer.start()
    }

    if(this.settings.dev) {
      this.express.use(this.renderer.vite.middlewares)
    } else {
      const staticPath = path.resolve(this.root, this.settings.spa ? 'dist/spa' : 'dist/client')
      this.express.use('/', expressStaticGzip(staticPath, {
        //enableBrotli: true,
        index: false,
        customCompressions: [{
          encodingName: 'br',
          fileExtension: 'br'
        },{
          encodingName: 'gzip',
          fileExtension: 'gz'
        },{
          encodingName: 'deflate',
          fileExtension: 'zz'
        }],
        orderPreference: ['br', 'gzip', 'deflate']
      }))
      //this.express.use(serveStatic(staticPath, { index: false }))
    }

    await this.setupSsr()
  }

  async createDao(credentials, clientIp) {
    let dao
    if(this.settings.daoFactory) {
      dao = await this.settings.daoFactory(credentials, clientIp)
    } else {
      const host = (this.settings.apiHost == '0.0.0.0' || !this.settings.apiHost)
        ? 'localhost' : this.settings.apiHost
      dao = await serverDao(credentials, clientIp, {
        remoteUrl: `ws://${host}:${this.settings.apiPort || 8002}/api/ws`
      })
    }
    if(!dao) {
      throw new Error("Impossible to render page without data access object. Define apiServer or daoFactory!")
    }
    return dao
  }

  async setupSsr() {
    const readCredentials = this.settings.readCredentials || ((req) => {
      const cookies = cookie.parse(req.headers.cookie || '')
      return { sessionKey: cookies.sessionKey || crypto.randomBytes(64).toString('base64').slice(0, 48) }
    })
    const writeCredentials = this.settings.writeCredentials || ((res, credentials) => {
      //console.log("WRITE CREDENTIALS", credentials)
      const cookieExpireDate =
        this.settings.sessionExpires ? new Date(Date.now() + this.settings.sessionExpires).toUTCString() : null
      if(credentials.sessionKey) {
        res.set({
          'Set-Cookie': `sessionKey=${credentials.sessionKey}; Path=/; HttpOnly`
          + (cookieExpireDate ? `; Expires=${cookieExpireDate}` : '')
        })
      }
    })

    this.express.get('/sitemap.xml', async (req, res) => {
      const sitemap = await this.renderer.getSitemap()
      const clientIp = getIp(req)
      const dao = await this.createDao({ sessionKey: 'sitemap' })
      this.renderer.renderSitemap({ dao, clientIp }, res)
    })
    this.express.use('*', async (req, res) => {
      if(fbRedirect(req, res)) return
      if(this.settings.spa) {
        if(this.settings.dev) {
          res.sendFile(path.resolve(this.root, 'index.html'))
        } else {
          res.sendFile(path.resolve(this.root, 'dist/spa/index.html'))
        }
        return;
      }
      const url = req.originalUrl
      const clientIp = getIp(req)

      const credentials = readCredentials(req)
      const windowId = this.uidGenerator()
      let dao
      try {
        dao = await this.createDao(credentials, clientIp)
      } catch (e) {
        console.error("DAO ERROR", e.stack || e)
        res.status(500).end(e.stack || e)
      }
      try {
        const version = this.version

        let result
        let error

        for(let retry = 0; retry < 3; retry ++) {
          try {
            const now = Date.now()
            result = await this.renderer.renderPage({
              url, headers: req.headers, dao, clientIp, credentials, windowId, version, now
            })
            break
          } catch(e) {
            error = e
          }
        }
        if(result) {
          const { html, response } = result
          res.status(response?.status || 200)
          writeCredentials(res, credentials)
          res.set(response?.headers ?? {
            'Content-Type': 'text/html'
          })
          res.end(html)
        } else {
          if(error.stack) this.renderer.fixStackTrace(error)
          console.error("RENDERING ERROR", error.stack || error)
          res.status(500).end(error.stack || error)
        }
      } catch (e) {
        console.error("ERROR", e.stack || e)
        res.status(500).end(e.stack || e)
      }
      dao.dispose()
    })
  }

  async close() {
    await this.renderer.close()
  }
}

export default SsrServer
