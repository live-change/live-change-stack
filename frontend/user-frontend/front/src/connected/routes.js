export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:connected', path: prefix + 'connected',
      component: () => import("./Connected.vue"), meta: { signedIn: true } }),

    route({ name: 'user:connect-email', path: prefix + 'connect-email',
      component: () => import("./ConnectEmail.vue"), meta: { signedIn: true } }),
    route({ name: 'user:connect-phone', path: prefix + 'connect-phone',
      component: () => import("./ConnectPhone.vue"), meta: { signedIn: true } }),

    /// redirect user:connect-google to google auth
    route({ name: 'user:connect-google', path: prefix + 'connect-google',
      redirect: { name: 'user:googleAuth', params: { action: 'connectGoogle' } }, meta: { signedIn: true } }),

    route({ name: 'user:connect-linkedin', path: prefix + 'connect-linkedin',
      redirect: { name: 'user:linkedinAuth', params: { action: 'connectLinkedin' } }, meta: { signedIn: true } }),

    route({ name: 'user:connectFinished', path: prefix + 'connect-finished',
      component: () => import("./ConnectFinished.vue"), meta: { signedIn: true } }),

  ]
}

export default routes
