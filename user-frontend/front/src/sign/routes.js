export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:signIn', path: prefix + 'sign-in',
      component: () => import("./SignIn.vue") }),
    route({ name: 'user:signInFinished', path: prefix + 'sign-in-finished',
      component: () => import("./SignInFinished.vue"), meta: { signedIn: true } }),

    route({ name: 'user:signUp', path: prefix + 'sign-up',
      component: () => import("./SignUp.vue") }),
    route({ name: 'user:signUpFinished', path: prefix + 'sign-up-finished',
      component: () => import("./SignUpFinished.vue"), meta: { signedIn: true } }),

    route({ name: 'user:signOut', path: prefix + 'sign-out',
      component: () => import("./SignOut.vue") }),
    route({ name: 'user:signOutFinished', path: prefix + 'sign-out-finished',
      component: () => import("./SignOutFinished.vue") }),

  ]
}

export default routes
