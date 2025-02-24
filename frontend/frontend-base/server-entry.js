import { renderToString } from 'vue/server-renderer'

import { serverApi } from '@live-change/vue3-ssr/serverApi.js'

import { createApp } from "./main.js"
import { setTime } from "./time.js"

import { renderHeadToString } from "@vueuse/head"
import { Theme } from '@primeuix/styled'
import { Base, BaseStyle } from '@primevue/core'

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
    await Promise.all([
      ...(config.serverPrefetch ?? []).map(fn => fn(app, router, head)),
      ...(config.prefetch ?? []).map(fn => fn(app, router, head)),
      api.preFetchRoute(router.currentRoute, router)
    ])

    const ctx = {}

    let usedStyles = new Set()
    Base.setLoadedStyleName = async (name) => usedStyles.add(name)

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
      const styleObject = await import(/* @vite-ignore */`primevue/${name}/style`)
      styleSheets.push(styleObject.default.getThemeStyleSheet())
    }
    styleSheets.push(BaseStyle.getThemeStyleSheet())

    renderedHead.headTags += styleSheets.join('\n')

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
