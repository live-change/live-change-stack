import { sitemap } from "@live-change/url-frontend"

export function blogEditRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [
    route({ name: 'blog:postEditor', path: prefix + 'post-editor/:postId', meta: { }, props: true,
      component: () => import("./BlogPostEditor.vue") }),
    route({ name: 'blog:postPreview', path: prefix + 'post-preview/:postId', meta: { }, props: true,
      component: () => import("./BlogPostPreview.vue") }),
    route({ name: 'blog:postsList', path: prefix + 'posts-list', meta: { }, props: true,
      component: () => import("./BlogPostsList.vue") }),
  ]
}

export function catchAllBlogRoute(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({
      name: 'blog:post', path: prefix + ':path(.*)', meta: { },
      component: () => import("./BlogPost.vue"),
      props: true
    })

  ]
}


export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

      ...blogEditRoutes(config),
      ...catchAllBlogRoute({ ...config, prefix: config.blogPrefix ?? '/blog/' })

  ]
}

export async function blogSitemap(route, api) {
  await sitemap(route, api, 'blog_Post', '/blog/')
}

export default routes
