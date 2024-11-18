import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import configurationRoutes from "./configuration/routes.js"
import inviteRoutes from "./invite/routes.js"

import { userRoutes, installUserRedirects } from "@live-change/user-frontend"
import { dbAdminRoutes } from "@live-change/db-admin"

export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [
    ...configurationRoutes(config),
    ...inviteRoutes(config),

    route({
      name: 'accessControl:configurationPage', path: prefix + 'configuration', meta: { },
      component: () => import("./configuration/AccessControl.vue"),
      props: {
        objectType: 'example_Example',
        object: 'one'
      }
    }),

  ]
}

export async function sitemap(route, api) {

}

import { client as useClient } from '@live-change/vue3-ssr'
import messageAuthRoutes from "../../../user-frontend/front/src/message-auth/routes";
import signRoutes from "../../../user-frontend/front/src/sign/routes";

export function createRouter(app, config) {
  //console.log("APP CTX", app._context)
  const client = useClient(app._context)
  const router = _createRouter({
    // use appropriate history implementation for server/client
    // import.meta.env.SSR is injected by Vite.
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      ...userRoutes({ ...config, prefix: prefix + 'user/' }),

      ...routes(config),

      {
        name: 'accessControl:testPage', path: '/', meta: { },
        component: () => import("./TestPage.vue"),
        props: {
          objectType: 'example_Example',
          object: 'one'
        }
      },

      {
        name: 'accessControl:invitationAccepted', path: '/accepted', meta: { },
        redirect: { name: 'accessControl:testPage' }
      },

      {
        name: 'accessControl:invitationFallback', path: '/fallback', meta: { },
        redirect: { name: 'accessControl:testPage' }
      },

      ...dbAdminRoutes({ prefix: '/_db', route: r => ({ ...r, meta: { ...r.meta, raw: true }}) })
    ]
  })
  installUserRedirects(router, app, config)
  return router
}

