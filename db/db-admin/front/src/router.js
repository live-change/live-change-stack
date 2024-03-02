import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import { routes as dbAdminRoutes } from './routes.js'

export function routes(config = {}) {
  const {
    prefix = '/',
    route = (r) => r,
    dbApi = 'serverDatabase'
  } = config
  return [

    route({
      path: prefix,
      component: () => import("./DatabaseAdmin.vue"),
      props: { dbApi },
      meta: { pageType: 'wide', noNavBar: true },
      children: [
        ...dbAdminRoutes({ ...config, prefix: '' })
      ]
    })

  ]
}

export async function sitemap(route, api) {
  /// Sitemap not needed
}

import { client as useClient } from '@live-change/vue3-ssr'

export function createRouter(app, config) {
  console.log("APP CTX", app._context)
  const client = useClient(app._context)
  const router = _createRouter({
    // use appropriate history implementation for server/client
    // import.meta.env.SSR is injected by Vite.
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: routes(config)
  })
  return router
}

