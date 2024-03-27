import { renderToString } from 'vue/server-renderer'

import { serverApi } from '@live-change/vue3-ssr/serverApi.js'

import { createApp } from "./main.js"
import { setTime } from "./time.js"

import { renderHeadToString } from "@vueuse/head"

function escapeHtml(unsafe) {
  return (''+unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

    const { app, router, head } = await createApp(
      config, api, App, createRouter, host, headers, response, url
    )

    app.directive('shared-element', {})

    // set the router to the desired URL before rendering
    router.push(url)
    await router.isReady()

    // prefetch data
    await api.preFetchRoute(router.currentRoute, router)
    // passing SSR context object which will be available via useSSRContext()
    // @vitejs/plugin-vue injects code into a component's setup() that registers
    // itself on ctx.modules. After the render, ctx.modules would contain all the
    // components that have been instantiated during this render call.
    const ctx = {}
    const html = await renderToString(app, ctx)

    const data = api.prerenderCache.cacheData()

    // the SSR manifest generated by Vite contains module -> chunk/asset mapping
    // which we can then use to determine what files need to be preloaded for this
    // request.

    const renderedHead = await renderHeadToString(head)

/*    const html = 'html'
    const renderedHead= 'head'
    const data = {}
    const ctx = { modules: [] }*/

    return { html, data, meta: renderedHead, modules: ctx.modules, response }
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

    const { app, router, head } = await createApp(
      config, api, App, createRouter, host, headers, response, url
    )

    const sitemapPrefix = `https://${ENV_BRAND_DOMAIN}`

    return routerSitemap((location, opts) => {
      write({ url: sitemapPrefix + router.resolve(location).href, changefreq: 'daily', priority: 0.5, ...opts })
    }, api)

  }
}
