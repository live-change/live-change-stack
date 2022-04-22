import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

import configurationRoutes from "./configuration/routes.js"
import inviteRoutes from "./invite/routes.js"

export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [

    ...configurationRoutes(config),
    ...inviteRoutes(config),

    route({
      name: 'accessControl:testPage', path: prefix + '', meta: { },
      component: () => import("./configuration/AccessControl.vue"),
      props: {
        objectType: 'example_Example',
        object: 'one'
      }
    })

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
    routes: routes(config)
  })
  router.beforeEach(async (to, from) => {
    if(to?.matched.find(m => m?.meta.signedIn)) {
      if(!client.value.user) {
        console.log("REDIRECT TO LOGIN BECAUSE PAGE REQUIRES LOGIN!")
        router.redirectAfterSignIn = to.fullPath
        return { name: 'user:signIn' }
      }
    }
    if(to?.matched.find(m => m?.meta.signedOut)) {
      if(client.value.user) {
        console.log("REDIRECT TO USER INDEX BECAUSE PAGE REQUIRES LOGOUT!")
        return { name: 'user:settings' }
      }
    }
    if(to && to.name == 'user:signIn' && from?.matched.find(m => m?.meta.saveForSignIn)) {
      console.log("SAVE FOR LOGIN", from.fullPath)
      localStorage.redirectAfterLogin = from.fullPath
    }
  })
  return router
}

