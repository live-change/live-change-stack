import { rimrafSync } from 'rimraf'
import fs from 'fs'
import Server from '../lib/Server.js'
import ReactiveDao from '@live-change/dao'

let serverPromise = null

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
})

export default function getServer() {
  if(serverPromise) return serverPromise
  serverPromise = (async () => {
    rimrafSync('test.db')
    await fs.promises.mkdir('test.db')
    const server = new Server({
      backend: process.env.DB_BACKEND || 'lmdb',
      dbRoot: 'test.db'
    })
    await server.initialize()
    server.connect = (sessionId, delay = 50) => new Promise((resolve, reject) => {
      const client = new ReactiveDao.LoopbackConnection(sessionId, server.apiServer, {
        onConnect: () => resolve(client),
        delay
      })
    })
    return server
  })()
  return serverPromise
}
