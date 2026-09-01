import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import { dbAdminRoutes } from "@live-change/db-admin"

export function flowRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [
    route({
      name: 'index',
      path: prefix,
      meta: { raw: true },
      component: () => import("./demo/FlowKitchenSink.vue")
    }),
    route({
      name: 'calculation',
      path: prefix + 'calc',
      meta: { raw: true },
      component: () => import("./demo/calculation/FlowCalculationDemo.vue")
    }),
    route({
      name: 'calculationDetail',
      path: prefix + 'calc/:calculation',
      meta: { raw: true },
      component: () => import("./demo/calculation/FlowCalculationDemo.vue")
    }),

    ...dbAdminRoutes({ prefix: '/_db', route: r => ({ ...r, meta: { ...r.meta, raw: true }}) })
  ]
}

export async function sitemap(route, api) {

}

export function createRouter(app, config) {
  const router = _createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: flowRoutes(config)
  })
  return router
}
