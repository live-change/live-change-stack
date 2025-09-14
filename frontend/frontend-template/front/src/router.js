import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import {
  installRouterAnalytics
} from '@live-change/vue3-components'

import { dbAdminRoutes } from "@live-change/db-admin"
import { autoFormRoutes } from "@live-change/frontend-auto-form"
import { taskAdminRoutes } from "@live-change/task-frontend"
import { userRoutes } from "@live-change/user-frontend"
import { catchAllPagesRoute, contentEditRoutes, pagesSitemap } from "@live-change/content-frontend"

import pagesRoutes from '~pages'

export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [
    ...userRoutes({ ...config, prefix: prefix + 'user/' }),
    ...autoFormRoutes({ ...config, prefix: prefix + 'auto-form' }),

    ...pagesRoutes,

    ...contentEditRoutes({ ...config }),

    ...taskAdminRoutes({ ...config, prefix: '/_task' }),
    ...dbAdminRoutes({ prefix: '/_db', route: r => ({ ...r, meta: { ...r.meta, raw: true }}) }),
    ...catchAllPagesRoute({ ...config }),
  ]
}

export async function sitemap(route, api) {
  route({
    name: 'index'
  })
  route({
    name: 'clock-test'
  })
  await pagesSitemap(route, api)
}

import { client as useClient } from '@live-change/vue3-ssr'

export function createRouter(app, config) {
  const client = useClient(app._context)

  const router = _createRouter({
    // use appropriate history implementation for server/client
    // import.meta.env.SSR is injected by Vite.
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: routes(config)
  })
  installRouterAnalytics(router)
  router.beforeEach(async (to, from) => {
    if(typeof window === 'undefined') { // don't do redirects on server-side, because we can't save redirect
      return
    }
    if(to?.matched.find(m => m?.meta.signedIn)) {
      if(!client.value.user) {
        console.log("REDIRECT TO LOGIN BECAUSE PAGE REQUIRES LOGIN!")
        localStorage.redirectAfterSignIn = JSON.stringify(to.fullPath)
        return { name: 'user:signInEmail' }
      }
    }
    if(to?.matched.find(m => m?.meta.signedOut)) {
      if(client.value.user) {
        console.log("REDIRECT TO USER INDEX BECAUSE PAGE REQUIRES LOGOUT!")
        return { name: 'user:settings' }
      }
    }
    if(to && to.name === 'user:signInEmail' && from?.matched.find(m => m?.meta.saveForSignIn)) {
      console.log("SAVE FOR LOGIN", from.fullPath)
      localStorage.redirectAfterSignIn = JSON.stringify(to.fullPath)
    }
  })
  return router
}

