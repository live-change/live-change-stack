export function autoFormRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [

    route({
      name: 'auto-form:models', path: prefix + '/models/:serviceName?', meta: { },
      component: () => import("./pages/Models.vue"),
      props: true
    }),

    route({
      name: 'auto-form:actions', path: prefix + '/actions/:serviceName?', meta: { },
      component: () => import("./pages/Actions.vue"),
      props: true
    }),

    route({
      name: 'auto-form:editor', path: prefix + '/editor/:serviceName/:modelName/:identifiers*', meta: { },
      component: () => import("./pages/Editor.vue"),
      props: true
    }),

    route({
      name: 'auto-form:view', path: prefix + '/view/:serviceName/:modelName/:identifiers*', meta: { },
      component: () => import("./pages/View.vue"),
      props: true
    }),

    route({
      name: 'auto-form:list', path: prefix + '/models/:serviceName/:modelName', meta: { },
      component: () => import("./pages/List.vue"),
      props: true
    }),

    route({
      name: 'auto-form:action', path: prefix + '/action/:serviceName/:actionName', meta: { },
      component: () => import("./pages/Action.vue"),
      props: true
    }),

    route({
      name: 'auto-form:actionParameters', path: prefix + '/action/:serviceName/:actionName/:parametersJson', meta: { },
      component: () => import("./pages/Action.vue"),
      props: true
    }),

  ]
}

export async function autoFormSitemap(route, api) {

}

import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'
import { dbAdminRoutes } from "@live-change/db-admin"
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
      ...autoFormRoutes({ ...config, prefix: '/peer-connection' }),
    ]
  })
  router.beforeEach(async (to, from) => {
    if(to?.matched.find(m => m?.meta.signedIn)) {
      if(!client.value.user) {
        console.log("REDIRECT TO LOGIN BECAUSE PAGE REQUIRES LOGIN!")
        router.redirectAfterSignIn = JSON.stringify(to.fullPath)
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
      router.redirectAfterSignIn = JSON.stringify(to.fullPath)
    }
  })
  return router
}

