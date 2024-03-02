export function passwordResetRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:resetPassword', path: prefix + 'reset-password',
      component: () => import("./ResetPassword.vue") }),
    route({ name: 'user:resetPasswordForm', path: prefix + 'set-new-password/:resetKey',
      component: () => import("./ResetPasswordForm.vue"), props: true }),
    route({ name: 'user:resetPasswordFinished', path: prefix + 'reset-password-finished',
      component: () => import("./ResetPasswordFinished.vue") }),

  ]
}


export function passwordChangeRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:changePassword', path: prefix + 'change-password',
      component: () => import("./ChangePassword.vue") }),
    route({ name: 'user:changePasswordFinished', path: prefix + 'change-password-finished',
      component: () => import("./ChangePasswordFinished.vue") })

  ]
}

export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

      ...passwordResetRoutes(config),
      ...passwordChangeRoutes(config)

  ]
}

export default routes