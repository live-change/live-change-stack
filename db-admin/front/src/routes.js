
export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({
      path: prefix,
      name: 'db:databases',
      component: () => import("./Databases.vue")
    }),

    route({
      path: prefix+'db/:dbName',
      name: 'db:database',
      component: () => import("./Database.vue"),
      props: true
    }),

    route({
      path: prefix+'data/:position/:read/:write/:remove/:params*',
      name: 'db:data',
      meta: { pageType: 'wide' },
      component: () => import("./Data.vue"),
      props: true
    }),

  ]
}

export default routes