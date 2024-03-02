module.exports = {
  services: [
    {
      name: 'session',
      path: '@live-change/session-service',
      createSessionOnUpdate: true
    },
    {
      name: 'upload',
      path: '@live-change/upload-service'
    },
    {
      name: "image",
      path: '@live-change/image-service'
    },
/*    {
      name: 'prosemirror',
      path: '@live-change/prosemirror-service',
      documentTypes: {
        rich: require('./rich.documentType.js'),
        page: require('./page.documentType.js')
      },
      testLatency: 1000
    }*/
  ]
}
