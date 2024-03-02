
export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    /// Message based authentication
    route({ name: 'user:sent', path: prefix + 'sent/:authentication', props: true,
      component: () => import("./MessageSent.vue") }),
    route({ name: 'user:link', path: prefix + 'link/:secretCode', props: true,
      component: () => import("./MessageLink.vue") }),

    route({ name: 'user:email:signUpWithMessage', path: '/_email/signUpWithMessage/:contact/:json', props: true,
      meta: { raw: true }, component: () => import("./SignUpEmail.vue") }),
    route({ name: 'user:email:signInWithMessage', path: '/_email/signInWithMessage/:contact/:json', props: true,
      meta: { raw: true }, component: () => import("./SignInEmail.vue") }),
    route({ name: 'user:email:connectWithMessage', path: '/_email/connectWithMessage/:contact/:json', props: true,
      meta: { raw: true }, component: () => import("./ConnectEmail.vue") }),
    route({ name: 'user:email:startResetPasswordWithMessage', path: '/_email/startResetPasswordWithMessage/:contact/:json',
      props: true, meta: { raw: true }, component: () => import("./ResetPasswordEmail.vue") }),

  ]
}

export default routes