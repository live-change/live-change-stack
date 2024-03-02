import { serverEntry } from '@live-change/frontend-base/server-entry.js'
import App from './App.vue'
import { createRouter } from './router'

const render = serverEntry(App, createRouter)
export { render }
