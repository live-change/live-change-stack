import definition from './definition.js'

const {
  contactTypes,
  notificationTypes,
  defaultSettings
} = definition.config

definition.clientConfig = {
  contactTypes,
  notificationTypes,
  defaultSettings
}

const config = {
  contactTypes,
  notificationTypes
}

export default config
