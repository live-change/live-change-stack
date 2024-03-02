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
    }
  ]
}
