export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:google-access-gained', path: prefix + 'google-offline-access-gained',
      component: () => import("./GoogleAccessGained.vue"), meta: { signedIn: true } }),

    route({ name: 'user:get-google-access', path: prefix + 'get-google-access/:scopes*',
      component: () => import("./GoogleAccess.vue"), meta: { signedIn: true }, props: true }),

  ]
}

export default routes
