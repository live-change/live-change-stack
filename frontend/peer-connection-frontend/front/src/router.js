import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import { dbAdminRoutes } from "@live-change/db-admin"

export function peerConnectionRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [

    route({
      name: 'peer-connection:debugger', path: prefix + '/debugger/:channelType/:channel/', meta: { },
      component: () => import("./components/Debugger.vue"),
      props: true
    }),

  ]
}

export async function sitemap(route, api) {

}

import { client as useClient } from '@live-change/vue3-ssr'

export function createRouter(app, config) {
  //console.log("APP CTX", app._context)
  const client = useClient(app._context)
  const router = _createRouter({
    // use appropriate history implementation for server/client
    // import.meta.env.SSR is injected by Vite.
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      ...dbAdminRoutes({ prefix: '/_db', route: r => ({ ...r, meta: { ...r.meta, raw: true }}) }),
      ...peerConnectionRoutes({ ...config, prefix: '/peer-connection' }),
      {
        name: 'peer-connection:test-debugger', path: '/', meta: { },
        component: () => import("./components/Debugger.vue"),
        props: {
          channelType: 'example_Example',
          channel: 'one'
        }
      }
    ]
  })
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

