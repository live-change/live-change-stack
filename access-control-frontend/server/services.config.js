const contactTypes = ['email']

module.exports = {
  services: [
    {
      name: 'timer',
      path: '@live-change/timer-service'
    },
    {
      name: 'session',
      path: '@live-change/session-service',
      createSessionOnUpdate: true
    },
    {
      name: 'user',
      path: '@live-change/user-service'
    },
    {
      name: 'email',
      path: '@live-change/email-service'
    },
    {
      name: 'secretLink',
      path: '@live-change/secret-link-service'
    },
    {
      name: 'secretCode',
      path: '@live-change/secret-code-service'
    },
    {
      name: 'messageAuthentication',
      path: '@live-change/message-authentication-service',
      contactTypes,
      signUp: true,
      signIn: true,
      connect: true
    },
    {
      name: 'passwordAuthentication',
      path: '@live-change/password-authentication-service',
      contactTypes,
      signInWithoutPassword: true
    },
    {
      name: 'userIdentification',
      path: '@live-change/user-identification-service'
    },
    {
      name: 'identicon',
      path: '@live-change/identicon-service'
    },
    {
      name: 'accessControl',
      path: '@live-change/access-control-service',
      createSessionOnUpdate: true,
      contactTypes,
    },
    {
      name: 'notification',
      path: '@live-change/notification-service',
      contactTypes,
      notificationTypes: ['accessControl_Invitation'],
      fields: {
        objectType: {
          type: String
        },
        object: {
          type: String
        },
        fromType: {
          type: String
        },
        from: {
          type: String
        }
      }
    },
  ]
}
