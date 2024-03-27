import { serverEntry, sitemapEntry } from '@live-change/frontend-base/server-entry.js'
import App from './App.vue'
import { createRouter, sitemap as routerSitemap } from './router'

const render = serverEntry(App, createRouter)
const sitemap = sitemapEntry(App, createRouter, routerSitemap)
export { render, sitemap }
