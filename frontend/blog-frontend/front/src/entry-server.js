import { serverEntry } from '@live-change/frontend-base/server-entry.js'
import App from './App.vue'
import { createRouter } from './router'
import config from './config.js'

const render = serverEntry(App, createRouter, config)
export { render }
