const crypto = require('crypto')
const ReactiveDao = require('@live-change/dao')
import definition from './definition.js'
const config = definition.config

const urls = config?.turn?.urls || process.env.TURN_URLS?.split(';')
const secret = config?.turn?.secret || process.env.TURN_SECRET
const turnExpireTime = config?.turn?.expire || (+process.env.TURN_EXPIRE) || (60 * 60) // 1 hour for default

const { clientHasAccessRole } = require("../access-control-service/access.js")(definition)

const { Peer } = require('./peer.js')

function randomHexString(size) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(size / 2, function(err, res) {
      if (err) return reject(err)
      resolve(res.toString('hex'))
    })
  })
}

async function createTurnConfiguration({ client }) {
  const expire = Date.now() / 1000 + turnExpireTime | 0
  const username = await randomHexString(10)
  const rusername = expire + ':' + username
  const password = crypto
    .createHmac('sha1', secret)
    .update(rusername)
    .digest('base64')
  /// TODO: select nearest servers by geoip
  return {
    urls,
    credentialType: 'password',
    username: rusername,
    credential: password,
    clientIp: client.ip
  }
}

async function releaseTurnConfiguration() {
  /// not used in static shared secret configuration
}

definition.view({
  name: "turnConfiguration",
  properties: {
    peer: {
      type: Peer
    }
  },
  access: async ({ peer },  { client, service, visibilityTest }) => {
    if(visibilityTest) return true
    const [ channelType, channel, sessionType, session, instance ] = peer.split(':')
    if(sessionType != 'session_Session') throw new Error('wrongSessionType')
    if(session != client.session) throw new Error('wrongSession')
    return clientHasAccessRole(client, { objectType: channelType.split('.')[0], object: channel },
        ['speaker', 'vip', 'moderator', 'owner'])
  },
  observable({ peer }, context) {
    const observable = new ReactiveDao.ObservableValue()
    let turnWorking = true
    const refreshTurn = async () => {
      if(observable.isDisposed()) {
        turnWorking = false
        return
      }
      try {
        observable.set(await createTurnConfiguration(context))
      } catch(error) {
        observable.error(error)
      }
      const refreshDelay = turnExpireTime * 1000 / 2
      setTimeout(refreshTurn, refreshDelay)
    }
    refreshTurn() // must be async!
    const oldRespawn = observable.respawn
    observable.respawn = () => {
      oldRespawn.call(observable)
      if(!turnWorking) refreshTurn() // must be async!
    }
    return observable
  },
  async get({ peer }, context) {
    return await createTurnConfiguration(context)
  }
})

export { createTurnConfiguration, releaseTurnConfiguration, turnExpireTime }
