export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:connected', path: prefix + 'connected',
      component: () => import("./Connected.vue") }),
    route({ name: 'user:connect', path: prefix + 'connect',
      component: () => import("./Connect.vue") }),
    route({ name: 'user:connectFinished', path: prefix + 'connect-finished',
      component: () => import("./ConnectFinished.vue") }),

  ]
}

export default routes
