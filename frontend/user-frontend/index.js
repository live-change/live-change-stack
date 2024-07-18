import UserIdentification from "./front/src/identification/UserIdentification.vue"
import ObjectIdentification from "./front/src/identification/ObjectIdentification.vue"
export { UserIdentification, ObjectIdentification }

import NotificationsIcon from "./front/src/notifications/NotificationsIcon.vue"
import SimpleNotification from "./front/src/notifications/SimpleNotification.vue"
import UnknownNotification from './front/src/notifications/UnknownNotification.vue'
import { notificationTypes } from "./front/src/notifications/notificationTypes.js"
export { NotificationsIcon, SimpleNotification, notificationTypes, UnknownNotification }

import UserIcon from "./front/src/nav/UserIcon.vue"
export { UserIcon }

import Password from "./front/src/password/Password.vue"
export { Password }

import GoogleAccess from './front/src/google-access/GoogleAccess.vue'
export { GoogleAccess }

export * from "./front/src/router.js"
