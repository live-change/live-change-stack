import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import './notification.js'
import './settings.js'
import './config.js'

export {
  isNotificationChannelActive,
  defaultChannelActive,
  listUserContacts,
  resolveChannelActiveFromSetting
} from './deliveryPreferences.js'

export {
  defaultChannelActive as defaultChannelActiveCore,
  resolveChannelActiveFromSetting as resolveChannelActiveFromSettingCore
} from './deliveryPreferencesCore.js'

export default definition
