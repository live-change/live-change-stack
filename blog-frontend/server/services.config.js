const contactTypes = ['email']

module.exports = {
  services: [
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
      name: 'url',
      path: '@live-change/url-service'
    },
    {
      name: 'prosemirror',
      path: '@live-change/prosemirror-service',
      documentTypes: {
        page: require('./page.documentType.js'),
        rich: require('./rich.documentType.js'),
      },
      testLatency: 2000
    },
    {
      name: 'upload',
      path: '@live-change/upload-service'
    },
    {
      name: "image",
      path: '@live-change/image-service'
    },
    {
      name: 'content',
      path: '@live-change/content-service',
    },
    {
      name: 'blog',
      path: '@live-change/blog-service',
    }

  ]
}
