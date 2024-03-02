import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import { dbAdminRoutes } from "@live-change/db-admin"
import { userRoutes } from "@live-change/user-frontend"
import { catchAllBlogRoute, blogEditRoutes, blogSitemap } from "./components/routes.js"

export function blogRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [
    ...userRoutes({ ...config, prefix: prefix + 'user/' }),

    ...blogEditRoutes({ ...config }),



    ...dbAdminRoutes({ prefix: '/_db', route: r => ({ ...r, meta: { ...r.meta, raw: true }}) }),

    ...catchAllBlogRoute({ ...config })
  ]
}

export async function sitemap(route, api) {
  await blogSitemap(route, api)
}


export function createRouter(app, config) {
  const router = _createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: blogRoutes(config)
  })
  return router
}

