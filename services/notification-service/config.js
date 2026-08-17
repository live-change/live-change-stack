import definition from './definition.js'

const {
  // Delivery channels for NotificationSetting UI / prefs (email, phone, web, …).
  // NOTE: `web` is a browser push endpoint, not an auth contact — pass it only here,
  // never in passwordAuthentication / messageAuthentication / accessControl contactTypes.
  // TODO: redesign as proper channel kinds (contact vs device/endpoint) instead of
  // overloading contactTypes with web_Web.
  contactTypes,
  notificationTypes,
  defaultSettings,
  fields = {}
} = definition.config || {}

definition.clientConfig = {
  contactTypes,
  notificationTypes,
  defaultSettings
}

const config = {
  contactTypes,
  notificationTypes,
  defaultSettings,
  fields
}

export default config
