export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:locale', path: prefix + 'locale',
      component: () => import("./LocaleSettings.vue") })

  ]
}

export default routes
