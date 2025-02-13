import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

definition.trigger({
  name: 'notificationCreated',
  properties: {
    notification: {
      type: Object
    },
    sessionOrUserType: {
      type: String,
      validation: ['nonEmpty']
    },
    sessionOrUser: {
      type: String,
      validation: ['nonEmpty']
    },
    notificationType: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute(params , { service }, emit) {
    /// TODO: think if this mechanism along with grouping could be moved to notification service
    /// TODO: check if user enabled email for this type of notification
  }
})

definition.trigger({
  name: 'checkEmailNotificationState',
  properties: {
    sessionOrUserType: {
      type: String,
      validation: ['nonEmpty']
    },
    sessionOrUser: {
      type: String,
      validation: ['nonEmpty']
    },
  },
  async execute(params , { service }, emit) {

    /// TODO: 1. get notifications by user
    /// TODO: 2. check if there are any notifications that are not emailed yed
    /// TODO: 3. decide if notifications should be grouped, partition notifications to grouped and non-grouped
    /// TODO: 4. send email for each group of notifications, and each non-grouped notification
    /// TODO: 5. mark notifications as emailed
  }
})