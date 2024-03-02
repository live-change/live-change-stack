export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:identification', path: prefix + 'identification',
      component: () => import("./IdentificationSettings.vue") })

  ]
}

export default routes
