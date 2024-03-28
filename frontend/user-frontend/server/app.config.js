import App from "@live-change/framework"
const app = App.app()

const contactTypes = ['email', 'phone']

import securityConfig from './security.config.js'

app.config = {
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
      name: 'phone',
      path: '@live-change/phone-service'
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
      name: 'security',
      path: '@live-change/security-service',
      ...securityConfig
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
      name: 'notification',
      path: '@live-change/notification-service',
      contactTypes,
      notificationTypes: ['example_TestNotification']
    },
    {
      name: 'upload',
      path: '@live-change/upload-service'
    },
    {
      name: 'image',
      path: '@live-change/image-service'
    },
    {
      name: 'backup',
      path: '@live-change/backup-service',
    }

    //  { path: '@live-change/google-account-service' },
  ]
}

export default app.config
