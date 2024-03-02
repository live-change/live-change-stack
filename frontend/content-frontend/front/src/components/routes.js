import { sitemap } from "@live-change/url-frontend"

export function contentEditRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'content:editor', path: prefix + 'content-editor/:documentId', meta: { }, props: true,
      component: () => import("./ContentEditor.vue") }),
    route({ name: 'content:pageEditor', path: prefix + 'page-editor/:pageId', meta: { }, props: true,
      component: () => import("./PageEditor.vue") }),
    route({ name: 'content:pagePreview', path: prefix + 'page-preview/:pageId', meta: { }, props: true,
      component: () => import("./PagePreview.vue") }),
    route({ name: 'content:pagesList', path: prefix + 'pages-list', meta: { }, props: true,
      component: () => import("./PagesList.vue") }),

  ]
}

export function catchAllPagesRoute(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({
      name: 'content:page', path: prefix + ':path(.*)', meta: { },
      component: () => import("./Page.vue"),
      props: true
    })

  ]
}

export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    ...contentEditRoutes(config),
    ...catchAllPagesRoute({ ...config, prefix: config.pagePrefix ?? '/' })

  ]
}

export async function pagesSitemap(route, api) {
  await sitemap(route, api, 'page_Page', '/')
}

export default routes
