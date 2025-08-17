import fs from 'fs'
import path from 'path'
import * as vite from 'vite'
import serialize from 'serialize-javascript'
import renderTemplate from './renderTemplate.js'
import { SitemapStream } from 'sitemap'
import vm from 'vm'
import { createRequire } from 'module'

class Renderer {
  constructor(manifest, settings) {
    this.manifest = manifest
    this.settings = settings
    this.root = this.settings.root || process.cwd()
  }

  async start() {
    if(this.settings.dev) {
      await this.setupVite()
    } else {
      const serverEntryPath = path.resolve(this.root, this.settings.serverEntry ?? './dist/server/server.cjs')
      const serverEntryCode = await fs.promises.readFile(serverEntryPath, { encoding: 'utf-8' })
      this.script = new vm.Script(serverEntryCode, {
        filename: serverEntryPath,
        lineOffset: 0,
        columnOffset: 0                
      })      
      this.baseContext = {
        require: createRequire(serverEntryPath),
        __dirname: path.dirname(serverEntryPath),
      }
      const templatePath = path.resolve(this.root, this.settings.templatePath ?? './dist/client/index.html')
      this.template = await fs.promises.readFile(templatePath, { encoding: 'utf-8' })
    }
  }

  async setupVite() {
    this.vite = await vite.createServer({
      root: this.root,
      mode: this.settings.mode,
      logLevel: 'info', //isTest ? 'error' : 'info',
      server: {
        middlewareMode: true,
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100
        }
      },
      appType: 'custom'
    })
  }

  async renderPage(params) {
    const { url, headers, dao, clientIp, credentials, windowId, version, now, domain } = params    

    const render = await this.getRenderFunction()
    const { html: appHtml, modules, data, meta, response } = await render(params)

    //console.log("META:", meta)

    const preloadLinks = this.renderPreloadLinks(modules)

    const appDataScript = `  <script>` +
        `    window.__DAO_CACHE__= ${serialize(data, { isJSON: true })}\n`+
        (this.settings.fastAuth ? ''
          : `    window.__CREDENTIALS__= ${serialize(credentials, { isJSON: true })}\n`)+
        `    window.__VERSION__ = ${serialize(version, { isJSON: true })}\n`+
        `    window.__WINDOW_ID__ = ${serialize(windowId, { isJSON: true })}\n`+
        `    window.__NOW__ = ${serialize(now, { isJSON: true })}\n`+
        `    console.info("SOFTWARE VERSION:" + window.__VERSION__)\n`+
        `</script>\n`

    const template = await this.prepareTemplate(url)

    const html = renderTemplate(template, {
      '<html>': (meta.htmlAttrs ? `<html ${meta.htmlAttrs}>` : '<html>'),
      '<head>': (meta.headAttrs ? `<head ${meta.headAttrs}>` : '<head>'),
      '<!--head-->': (meta.headTags || '') + '\n' + preloadLinks,
      '<body>': (meta.bodyAttrs ? `<body ${meta.bodyAttrs}>` : '<body>') + '\n' + (meta.bodyPrepend || ''),
      '<!--body-tags-open-->': meta.bodyTagsOpen || '',
      '<!--body-tags-->': meta.bodyTags || '',
      '<!--app-html-->': appHtml,
      '<!--app-data-->': appDataScript
    })

    return { html, response }
  }

  renderPreloadLink(file) {
    if (file.endsWith('.js')) {
      return `<link rel="modulepreload" crossorigin href="${file}">`
    } else if (file.endsWith('.css')) {
      return `<link rel="stylesheet" href="${file}">`
    } else {
      // TODO
      return ''
    }
  }

  renderPreloadLinks(modules) {
    if(!this.manifest) return ''
    let links = ''
    const seen = new Set()
    modules.forEach((id) => {
      const files = this.manifest[id]
      if (files) {
        files.forEach((file) => {
          if (!seen.has(file)) {
            seen.add(file)
            links += this.renderPreloadLink(file)
          }
        })
      }
    })
    return links
  }

  async prepareTemplate(url) {
    let template = this.template
    if(this.settings.dev) {
      const templatePath = path.resolve(this.root, this.settings.templatePath || 'index.html')
      template = await fs.promises.readFile(templatePath, { encoding: 'utf-8' })
      template = await this.vite.transformIndexHtml(url, template)
    }
    return template
  }

  async createRenderContext() {
    const contextObject = {
      //...globalThis,
      ...this.baseContext,
      exports: {},
      //process: process,
      process: {
        env: {
          NODE_ENV: 'production'
        },
        stdout: process.stdout,
        stderr: process.stderr,       
      } 
    }
    const requestContext = vm.createContext(contextObject, {
      name: 'Render function',
      ///microtaskMode: 'afterEvaluate'        
    })
    this.script.runInContext(requestContext) 
    return contextObject    
  }

  async getRenderFunction() {
    if(this.settings.dev) {
      /// Reload every request
      const entryPath = path.resolve(this.root, this.settings.serverEntry || 'src/entry-server.js')
      return (await this.vite.ssrLoadModule(entryPath)).render
    } else {
      const context = await this.createRenderContext()
      return context.exports.render
    }
  }

  async getSitemapRenderFunction() {
    if(this.settings.dev) {
      /// Reload every request
      const entryPath = path.resolve(this.root, this.settings.serverEntry || 'src/entry-server.js')
      return (await this.vite.ssrLoadModule(entryPath)).sitemap
    } else {
      const context = await this.createRenderContext()
      return context.exports.sitemap
    }
  }

  async renderSitemap(params, res) {
    try {
      const { url, headers, dao, clientIp, credentials, windowId, version, now, domain } = params

      res.header('Content-Type', 'application/xml')
      res.status(200)
      const smStream = new SitemapStream({
        hostname: (process.env.BASE_HREF ?? (domain ? `https://${domain}` : "https://sitemap.com"))+'/'
      })
      smStream.pipe(res)
      const sitemapFunction = await this.getSitemapRenderFunction()

      function write(routeInfo) {
        smStream.write(routeInfo)
      }

      await sitemapFunction(params, write)
      //route({ name: 'index' })
      smStream.end()
    } catch(err) {
      console.error("SITEMAP RENDERING ERROR", err)
      res.status(503)
      res.end(`<h4>Internal server error</h4><pre>${err.stack || err.code || err}</pre>`)
      //if(profileOp) await profileLog.end({ ...profileOp, state: 'error', error: err })
    }
  }

  fixStackTrace(e) {
    try {
      this.vite && this.vite.ssrFixStacktrace(e)
    } catch(e) {
      console.error("Error fixing stack trace!")
    }
  }

  async close() {
    if(this.vite) {
      console.log("VITE CLOSE!!!")
      await this.vite.close()
    }
  }

}

export default Renderer
