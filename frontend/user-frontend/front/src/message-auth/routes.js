
export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    /// Message based authentication
    route({ name: 'user:sent', path: prefix + 'sent/:authentication', props: true,
      component: () => import("./MessageSent.vue") }),
    route({ name: 'user:link', path: prefix + 'link/:secretCode', props: true,
      component: () => import("./MessageLink.vue") }),

    route({ name: 'user:email:signUpWithMessage', path: '/_email/signUpWithMessage/:contact/:json', props: true,
      meta: { raw: true, lightMode: true }, component: () => import("./email/SignUpEmail.vue") }),
    route({ name: 'user:email:signInWithMessage', path: '/_email/signInWithMessage/:contact/:json', props: true,
      meta: { raw: true, lightMode: true }, component: () => import("./email/SignInEmail.vue") }),
    route({ name: 'user:email:connectWithMessage', path: '/_email/connectWithMessage/:contact/:json', props: true,
      meta: { raw: true, lightMode: true }, component: () => import("./email/ConnectEmail.vue") }),
    route({
      name: 'user:email:startResetPasswordWithMessage',
      path: '/_email/startResetPasswordWithMessage/:contact/:json',
      props: true, meta: { raw: true, lightMode: true }, component: () => import("./email/ResetPasswordEmail.vue")
    }),

    route({ name: 'user:sms:signUpWithMessage', path: '/_sms/signUpWithMessage/:contact/:json', props: true,
      meta: { raw: true, lightMode: true }, component: () => import("./sms/SignUpSms.vue") }),
    route({ name: 'user:sms:signInWithMessage', path: '/_sms/signInWithMessage/:contact/:json', props: true,
      meta: { raw: true, lightMode: true }, component: () => import("./sms/SignInSms.vue") }),
    route({ name: 'user:sms:connectWithMessage', path: '/_sms/connectWithMessage/:contact/:json', props: true,
      meta: { raw: true, lightMode: true }, component: () => import("./sms/ConnectSms.vue") }),
    route({
      name: 'user:sms:startResetPasswordWithMessage',
      path: '/_sms/startResetPasswordWithMessage/:contact/:json',
      props: true, meta: { raw: true, lightMode: true }, component: () => import("./sms/ResetPasswordSms.vue")
    }),

  ]
}

export default routes