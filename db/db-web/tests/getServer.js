const Server = require('../lib/Server.js')
const ReactiveDao = require('@live-change/dao')

serverPromise = (async () => {
  const server = new Server({
    backend: 'mem',
    dbPrefix: 'test.db'
  })
  await server.initialize()
  const apiServer = new ReactiveDao.ReactiveServer((sessionId) => server.createDao(sessionId))
  server.connect = (sessionId, delay = 50) => new Promise((resolve, reject) => {
    const client = new ReactiveDao.LoopbackConnection(sessionId, apiServer, {
      onConnect: () => resolve(client),
      delay
    })
  })
  return server
})()

module.exports = serverPromise
