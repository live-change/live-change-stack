export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:googleAuth', path: prefix + 'google-auth/:action',
      component: () => import("./GoogleAuth.vue"), props: true, meta: { signedOut: true } }),
    route({ name: 'user:googleAuthReturn', path: prefix + 'google-auth-return/:action',
      component: () => import("./GoogleAuthReturn.vue"), props: true }),

    route({ name: 'user:signInEmail', path: prefix + 'sign-in-email',
      component: () => import("./SignInEmail.vue"), meta: { signedOut: true } }),
    route({ name: 'user:signInFinished', path: prefix + 'sign-in-finished',
      component: () => import("./SignInFinished.vue"), meta: { signedIn: true } }),

    route({ name: 'user:signUpEmail', path: prefix + 'sign-up-email',
      component: () => import("./SignUpEmail.vue"), meta: { signedOut: true } }),
    route({ name: 'user:signUpFinished', path: prefix + 'sign-up-finished',
      component: () => import("./SignUpFinished.vue"), meta: { signedIn: true } }),

    route({ name: 'user:signOut', path: prefix + 'sign-out',
      component: () => import("./SignOut.vue") }),
    route({ name: 'user:signOutFinished', path: prefix + 'sign-out-finished',
      component: () => import("./SignOutFinished.vue"), meta: { signedOut: true } }),

  ]
}

export default routes
