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
      name: 'online',
      path: '@live-change/online-service',
      createSessionOnUpdate: true
    },
    {
      name: 'peerConnection',
      path: '@live-change/peer-connection-service',
      turn: {
        urls: 'turn:turn1.xaos.ninja:4433;turn:turn2.xaos.ninja:4433'
      }
    }
  ]
}
