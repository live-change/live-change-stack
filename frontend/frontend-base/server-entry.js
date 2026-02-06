import { renderToString } from 'vue/server-renderer'

import { serverApi } from '@live-change/vue3-ssr/serverApi.js'

import { createApp } from "./main.js"
import { setTime } from "./time.js"

import { renderHeadToString } from "@vueuse/head"
import { Theme } from '@primeuix/styled'
import { Base, BaseStyle } from '@primevue/core'

import * as primeVue from 'primevue'
const components = {}
for(const name in primeVue) {
  const object = primeVue[name]
  if(object.style) {
    components[object.name] = object
  }
}

export function serverEntry(App, createRouter, config = {}) {
  return async function({ url, headers, dao, windowId, now }) {
    setTime(now)

    const host = headers['host']
    console.error('URL', host, url)

    const response = {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    }

    const api = await serverApi(dao, {
      use: [],
      windowId
    })

    const { app, router, head, errorLog } = await createApp(
      config, api, App, createRouter, host, headers, response, url
    )

    app.directive('shared-element', {})

    // set the router to the desired URL before rendering
    router.push(url)
    await router.isReady()

    // prefetch data
    await Promise.all([
      ...(config.serverPrefetch ?? []).map(fn => fn(app, router, head)),
      ...(config.prefetch ?? []).map(fn => fn(app, router, head)),
      api.preFetchRoute(router.currentRoute, router)
    ])

    const ctx = {}

    let usedStyles = new Set()
    Base.setLoadedStyleName = async (name) => usedStyles.add(name)

    try { 
      const html = await renderToString(app, ctx)
   
      // get the prerender cache data
      const data = api.prerenderCache.cacheData()

      const renderedHead = await renderHeadToString(head) 


      const styleSheets = []
      styleSheets.push(`<style type="text/css" data-primevue-style-id="layer-order">${
        BaseStyle.getLayerOrderThemeCSS()}</style>`)
      BaseStyle.getLayerOrderThemeCSS()

      styleSheets.push(Theme.getCommonStyleSheet())
      for(const name of usedStyles) {
        styleSheets.push(Theme.getStyleSheet(name))
        try {
          //const styleObject = await import(/* @vite-ignore */`primevue/${name}/style`)
          const component = components[name]
          if(!component) continue;
          //console.log("COMPONENT", component)
          styleSheets.push(component.getThemeStyleSheet())        
        } catch (e) {
          console.error('Error loading '+name+' style', e)
        }
      }
      styleSheets.push(BaseStyle.getThemeStyleSheet())

      renderedHead.headTags += styleSheets.join('\n')

      return { html, data, meta: renderedHead, modules: ctx.modules, response }
    } catch (error) {
      console.error('SSR renderToString error:', error.message, error.stack, "URL", url)
      errorLog.push({ message: error.message, stack: error.stack, url: url })
      /// concatente the error log to string, and throw it all
      const errorString = errorLog.map(e => e.message + '\n' + e.stack + '\n' + e.url).join('\n')
      throw new Error(errorString)
    }
  }
}

export function sitemapEntry(App, createRouter, routerSitemap, config = {}) {
  return async function({ url, headers, dao, windowId, now }, write) {
    setTime(now)

    console.log("SM DAO", dao)

    const api = await serverApi(dao, {
      use: [],
      windowId
    })

    const host = headers['host']
    console.error('URL', host, url)

    const response = {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    }

    const { app, router, head, errorLog } = await createApp(
      config, api, App, createRouter, host, headers, response, url
    )

    const domain = api.metadata.config.value.domain

    const sitemapPrefix = `https://${domain}`

    try {
      return routerSitemap((location, opts) => {
        write({ url: sitemapPrefix + router.resolve(location).href, changefreq: 'daily', priority: 0.5, ...opts })
      }, api)
    } catch (error) {
      console.error('SSR sitemap error:', error.message, error.stack, "URL", url)
      errorLog.push({ message: error.message, stack: error.stack, url: url })
      /// concatente the error log to string, and throw it all
      const errorString = errorLog.map(e => e.message + '\n' + e.stack + '\n' + e.url).join('\n')
      throw new Error(errorString)
    }

  }
}
