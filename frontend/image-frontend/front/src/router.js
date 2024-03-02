import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import { dbAdminRoutes } from "@live-change/db-admin"

export function wysiwygRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [
    route({
      name: 'upload:test', path: prefix + 'upload', meta: { },
      component: () => import("./UploadTest.vue"),
      props: {
      }
    }),
    route({
      name: 'editor:test', path: prefix + '', meta: { },
      component: () => import("./EditorTest.vue"),
      props: {
      }
    }),
    route({
      name: 'input:test', path: prefix + 'input', meta: { },
      component: () => import("./InputTest.vue"),
      props: {
      }
    }),

    ...dbAdminRoutes({ prefix: '/_db', route: r => ({ ...r, meta: { ...r.meta, raw: true }}) })
  ]
}

export async function sitemap(route, api) {

}


export function createRouter(app, config) {
  const router = _createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: wysiwygRoutes(config)
  })
  return router
}

