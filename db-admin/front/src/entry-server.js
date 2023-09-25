import { renderToString } from 'vue/server-renderer'

import { renderHeadToString } from "@vueuse/head"

import { serverApi } from '@live-change/vue3-ssr/serverApi.js'

import { createApp } from './main'

function escapeHtml(unsafe) {
  return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

export async function render({ url, dao, windowId }) {
  const api = await serverApi(dao, {
    use: [ ]
  })

  const { app, router, head } = createApp(api)

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
  //console.log("PRERENDER CACHE", Array.from(api.prerenderCache.cache.keys()))
  //console.log("PRERENDER CACHE EXTENDED", Array.from(api.prerenderCache.extendedCache.keys()))

  const renderedHead = await renderHeadToString(head)

  return { html, data, meta: renderedHead, modules: ctx.modules }
}
