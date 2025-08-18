import fs from 'fs'
import path from 'path'
import * as vite from 'vite'
import serialize from 'serialize-javascript'
import renderTemplate from './renderTemplate.js'
import { SitemapStream } from 'sitemap'
import vm from 'vm'
import { constants } from 'vm'
import { createRequire } from 'module'
import RenderContext from './RenderContext.js'

class Renderer {
  constructor(manifest, settings) {
    this.manifest = manifest
    this.settings = settings
    this.root = this.settings.root || process.cwd()
    this.contextPool = []
    this.waitingQueue = []
    this.poolSize = this.settings.contextPoolSize || 2
    this.maxQueueSize = this.settings.maxQueueSize || 20 // 10x pool size seems reasonable
  }

  async start() {
    if(this.settings.dev) {
      await this.setupVite()
    } else {
      const serverEntryPath = path.resolve(this.root, this.settings.serverEntry ?? './dist/server/entry-server.js')
      //const serverEntryCode = await fs.promises.readFile(serverEntryPath, { encoding: 'utf-8' })
      const serverEntryCode = 
       `import('./entry-server.js').then(m=>Object.entries(m).forEach(([k,v])=>exports[k]=v))`
      this.script = new vm.Script(serverEntryCode, {
        filename: path.dirname(serverEntryPath)+'/entrypoint.generated.js',
        lineOffset: 0,
        columnOffset: 0,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER
      })
      this.baseContext = {
        require: createRequire(serverEntryPath),
        __dirname: path.dirname(serverEntryPath),
      }
      
      // Create pool of render contexts
      for (let i = 0; i < this.poolSize; i++) {
        const context = new RenderContext(this.settings, this.baseContext, this.script)
        await context.start()
        this.contextPool.push(context)
      }
      
      const templatePath = path.resolve(this.root, this.settings.templatePath ?? './dist/client/index.html')
      this.template = await fs.promises.readFile(templatePath, { encoding: 'utf-8' })
    }
  }

  // Get a context from pool, wait if none available
  async getContext() {
    return new Promise((resolve, reject) => {
      if (this.contextPool.length > 0) {
        // Context available immediately
        const context = this.contextPool.pop()
        resolve(context)
      } else {
        // Check queue limit before adding to waiting queue
        if (this.waitingQueue.length >= this.maxQueueSize) {
          reject(new Error(`Render queue is full (${this.maxQueueSize} waiting requests). Server overloaded.`))
          return
        }
        // No context available, add to waiting queue
        this.waitingQueue.push(resolve)
      }
    })
  }

  // Release context back to pool and serve waiting requests
  releaseContext(context) {
    if (this.waitingQueue.length > 0) {
      // Someone is waiting, give context directly to them
      const resolve = this.waitingQueue.shift()
      resolve(context)
    } else {
      // No one waiting, return to pool
      this.contextPool.push(context)
    }
  }

  // Higher-order function for context management with timeout
  async withContext(callback) {
    if (this.settings.dev) {
      // In dev mode, no context needed
      return await callback(null)
    } else {
      const context = await this.getContext()
      const timeout = this.settings.renderTimeout || 10000 // 10 seconds default
      let isTimedOut = false
      let shouldReplaceContext = false
      
      // Increment usage counter
      context.incrementUse()
      
      try {
        // Race between callback and timeout
        const result = await Promise.race([
          callback(context),
          new Promise((_, reject) => {
            setTimeout(() => {
              isTimedOut = true
              reject(new Error(`Render timeout after ${timeout}ms`))
            }, timeout)
          })
        ])
        
        return result
      } catch (error) {
        // Mark context for replacement on any error
        shouldReplaceContext = true
        throw error
      } finally {
        if (isTimedOut || shouldReplaceContext || context.shouldReplace()) {
          // Stop the context and create a replacement
          context.stop()
          const newContext = new RenderContext(this.settings, this.baseContext, this.script)
          await newContext.start()
          this.releaseContext(newContext)
        } else {
          // Normal release back to pool
          this.releaseContext(context)
        }
      }
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
    const startTime = Date.now()

    try {
      // Use withContext only for the actual rendering part
      const { html: appHtml, modules, data, meta, response } = await this.withContext(async (context) => {
        const render = await this.getRenderFunction(context)
        return await render(params)
      })

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
    } finally {
      this.logRenderStats(url, startTime)
    }
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

  async getRenderFunction(context = null) {
    if(this.settings.dev) {
      /// Reload every request
      const entryPath = path.resolve(this.root, this.settings.serverEntry || 'src/entry-server.js')
      return (await this.vite.ssrLoadModule(entryPath)).render
    } else {
      return context.getExports().render
    }
  }

  async getSitemapRenderFunction(context = null) {
    if(this.settings.dev) {
      /// Reload every request
      const entryPath = path.resolve(this.root, this.settings.serverEntry || 'src/entry-server.js')
      return (await this.vite.ssrLoadModule(entryPath)).sitemap
    } else {
      return context.getExports().sitemap
    }
  }

  async renderSitemap(params, res) {
    const { url, headers, dao, clientIp, credentials, windowId, version, now, domain } = params
    const startTime = Date.now()

    try {
      res.header('Content-Type', 'application/xml')
      res.status(200)
      const smStream = new SitemapStream({
        hostname: (process.env.BASE_HREF ?? (domain ? `https://${domain}` : "https://sitemap.com"))+'/'
      })
      smStream.pipe(res)
      
      // Use withContext only for the actual sitemap function execution
      const sitemapFunction = await this.withContext(async (context) => {
        return await this.getSitemapRenderFunction(context)
      })

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
    } finally {
      this.logRenderStats(`${url} (sitemap)`, startTime)
    }
  }

  fixStackTrace(e) {
    try {
      this.vite && this.vite.ssrFixStacktrace(e)
    } catch(e) {
      console.error("Error fixing stack trace!")
    }
  }

  // Log render statistics in compact format
  logRenderStats(url, startTime) {
    if (this.settings.dev) return // Skip logging in dev mode

    const renderTime = Date.now() - startTime
    const stats = this.getPoolStats()
    
    // Get context usage info if available
    let contextInfo = ''
    for(const context of this.contextPool) {
      const contextStats = context.getTimerStats()
      contextInfo += `ctx:${contextStats.useCount}/${contextStats.maxUses} `
    }
    
    // Compact one-line format: URL | time | pool status | queue status | context usage
    console.log(`RENDER ${url} | ${renderTime}ms | pool:${stats.availableContexts}/${stats.poolSize} | queue:${stats.waitingRequests}/${stats.maxQueueSize} | ${contextInfo}`)
  }

  // Get pool statistics for monitoring
  getPoolStats() {
    return {
      poolSize: this.poolSize,
      maxQueueSize: this.maxQueueSize,
      availableContexts: this.contextPool.length,
      waitingRequests: this.waitingQueue.length,
      activeContexts: this.poolSize - this.contextPool.length,
      queueUtilization: Math.round((this.waitingQueue.length / this.maxQueueSize) * 100)
    }
  }

  async close() {
    if(this.vite) {
      console.log("VITE CLOSE!!!")
      await this.vite.close()
    }
    // Clear any pending timeouts/intervals from all contexts in pool
    for (const context of this.contextPool) {
      context.clearTimeouts()
    }
    // Clear waiting queue
    this.waitingQueue = []
  }

}

export default Renderer
