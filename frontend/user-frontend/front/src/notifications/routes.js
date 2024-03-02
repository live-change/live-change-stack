

export function notificationsSettingsRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:notificationsSettings', path: prefix + 'notifications-settings', props: true,
      component: () => import("./NotificationsSettings.vue"), meta: { signedIn: true } }),

  ]
}


export function notificationsRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:notificationsList', path: prefix + 'notifications', props: true,
      component: () => import("./NotificationListPage.vue"), meta: { signedIn: true } }),

  ]
}

export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    ...notificationsRoutes(config),
    ...notificationsRoutes(config)

  ]
}

export default routes