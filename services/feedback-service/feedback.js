import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const Session = definition.foreignModel('session_Session')
const User = definition.foreignModel('user_User')

const feedbackParameters = {
  type: {
    type: String,
    validation: ['nonEmpty'],
    enum: config.feedbackTypes,
  },
  content: {
    type: String,
    validation: ['nonEmpty'],
    input: 'textarea',
  },    
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  trace: {
    type: String
  },
  userAgent: {
    type: String,
    validation: ['nonEmpty'],
  },
  email: {
    type: String,    
  },
  ...config.feedbackProperties,
}

const Feedback = definition.model({
  name: "Feedback",
  entity: {
    readAccessControl: {
      roles: config.readerRoles
    },
    writeAccessControl: {
      roles: config.adminRoles
    },
    deleteAccessControl: {
      roles: config.adminRoles
    }
  },
  properties: {
    session: {
      type: Session,
    },
    user: {
      type: User,
    },
    ip: {
      type: String,
      validation: ['nonEmpty'],
    },
    ...feedbackParameters,
  },
})

const leaveFeedback = definition.action({
  name: 'leaveFeedback',
  properties: {
    ...feedbackParameters,
  },
  returns: {
    type: Feedback,
  },
  async execute(params, { client, service, trigger, command, triggerService }, emit) {
    const feedbackData = {
      ...params,
      ip: client.ip,
      session: client.session,
      user: client.user,
    }
    const feedback = await triggerService({
      service: definition.name,
      type: 'feedback_createFeedback'
    }, feedbackData)

    await triggerService({
      service: 'email',
      type: 'sendEmailMessage'
    }, {
      email: config.adminEmail,
      render: {        
        contact: config.adminEmail,
        action: 'feedbackReceived',
        feedback,        
        ...feedbackData
      }
    })

    return feedback
  }
})

export { Feedback }