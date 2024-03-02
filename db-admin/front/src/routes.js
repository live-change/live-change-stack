
export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  const { dbApi = 'serverDatabase' } = config

  return [
    route({
      path: prefix,
      name: 'db:databases',
      component: () => import("./Databases.vue"),
      props: (route) => ({ ...route.params, dbApi })
    }),

    route({
      path: prefix+'db/:dbName',
      name: 'db:database',
      component: () => import("./Database.vue"),
      props: (route) => ({ ...route.params, dbApi })
    }),

    route({
      path: prefix+'data/:position/:read/:write/:remove/:params*',
      name: 'db:data',
      meta: { pageType: 'wide' },
      component: () => import("./Data.vue"),
      props: (route) => ({ ...route.params, dbApi })
    }),

  ]
}

export default routes
