
export function routes(config = {}) {
  const { prefix = '', route = (r) => r } = config

  return [

    /// Message based authentication
    route({ name: 'user:sent', path: prefix + '/sent/:authentication', props: true,
      component: () => import("./MessageSent.vue") }),
    route({ name: 'user:link', path: prefix + '/link/:secretCode', props: true,
      component: () => import("./MessageLink.vue") }),

    route({ name: 'user:email:signUpWithMessage', path: '/_email/signUpWithMessage/:contact/:json', props: true,
      meta: { raw: true }, component: () => import("./SignUpEmail.vue") }),

  ]
}

export default routes