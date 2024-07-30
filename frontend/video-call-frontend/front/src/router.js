import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import {
  installRouterAnalytics
} from '@live-change/vue3-components'

import { dbAdminRoutes } from "@live-change/db-admin"
import { peerConnectionRoutes } from "@live-change/peer-connection-frontend"
import { userRoutes } from '@live-change/user-frontend'

export function videoCallRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [
    route({
      name: 'video-call:room', path: prefix+ '/room/:room', meta: { }, props:true,
      component: () => import("./room/Room.vue"),
    }),

  ]
}

export async function sitemap(route, api) {

}

import { client as useClient } from '@live-change/vue3-ssr'


export function createRouter(app, config) {
  const client = useClient(app._context)

  const router = _createRouter({
    // use appropriate history implementation for server/client
    // import.meta.env.SSR is injected by Vite.
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      ...userRoutes({ ...config, prefix: '/user/' }),
      ...peerConnectionRoutes({ ...config, prefix: '/peer-connection/' }),
      ...dbAdminRoutes({ prefix: '/_db', route: r => ({ ...r, meta: { ...r.meta, raw: true }}) }),
      ...videoCallRoutes(config),
      {
        name: 'video-call:test-room', path: '/', meta: { raw: true },
        component: () => import("./room/Room.vue"),
        props: {
          room: '[test-room]'
        }
      }
    ]
  })
  installRouterAnalytics(router)
  router.beforeEach(async (to, from) => {
    if(to?.matched.find(m => m?.meta.signedIn)) {
      if(!client.value.user) {
        console.log("REDIRECT TO LOGIN BECAUSE PAGE REQUIRES LOGIN!")
        router.redirectAfterSignIn = to.fullPath
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
      localStorage.redirectAfterLogin = from.fullPath
    }
  })
  return router
}

