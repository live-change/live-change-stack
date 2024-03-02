

export function catchAllNotFoundRoute(config = {}) {
  const {prefix = '/', route = (r) => r} = config

  return [

    route({
      name: 'content:notFound', path: prefix + ':path(.*)', meta: {},
      component: () => import("./NotFound.vue"),
      props: true
    })

  ]
}