import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import { dbAdminRoutes } from "@live-change/db-admin"
import { userRoutes } from "@live-change/user-frontend";
import { catchAllPagesRoute, contentEditRoutes, pagesSitemap } from "./components/routes";

export function contentRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [
    ...userRoutes({ ...config, prefix: prefix + 'user/' }),

    ...contentEditRoutes({ ...config }),

    ...dbAdminRoutes({ prefix: '/_db', route: r => ({ ...r, meta: { ...r.meta, raw: true }}) }),
    ...catchAllPagesRoute({ ...config })
  ]
}

export async function sitemap(route, api) {
  await pagesSitemap(route, api)
}


export function createRouter(app, config) {
  const router = _createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      {
        name: 'page:test', path: prefix, meta: { },
        redirect: to => {
          return { name: 'content:page', params: { path: 'test' } }
        }
      },
      ...contentRoutes(config)
    ]
  })
  return router
}

