import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import { dbAdminRoutes } from "@live-change/db-admin"
import {userRoutes} from "../../../user-frontend";

export function wysiwygRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [
    ...userRoutes({ ...config, prefix: prefix + 'user/' }),

    route({
      name: 'urls:examplePage', path: prefix + '',
      component: () => import("./UrlsPage.vue"),
      props: {
        targetType: 'example_Example',
        target: 'one'
      },
      meta: {
        wide: true
      }
    }),

    route({
      name: 'urls:exampleListPage',
      path: prefix + 'list',
      component: () => import("./UrlsListPage.vue"),
      props: {
        targetType: 'example_Example',
      },
      meta: {
        wide: true
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

