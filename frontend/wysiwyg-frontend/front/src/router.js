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
      name: 'wysiwyg:editorWithPreview', path: prefix + '', meta: { },
      component: () => import("./EditorWithPreview.vue"),
      props: {
      }
    }),

    route({
      name: 'wysiwyg:documentEditor', path: prefix + 'doc/:target', meta: { },
      component: () => import("./DocumentEditorTest.vue"),
      props: true
    }),

    route({
      name: 'wysiwyg:documentPreview', path: prefix + 'view/:target', meta: { },
      component: () => import("./DocumentPreviewTest.vue"),
      props: true
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

