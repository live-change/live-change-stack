import { serverEntry, sitemapEntry } from '@live-change/frontend-base/server-entry.js'
import App from './App.vue'
import { createRouter, sitemap as routerSitemap } from './router'
import config from './config.js'

const render = serverEntry(App, createRouter, config)
const sitemap = sitemapEntry(App, createRouter, routerSitemap, config)
export { render, sitemap }
