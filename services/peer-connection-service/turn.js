import crypto from 'crypto'
import ReactiveDao from '@live-change/dao'
import definition from './definition.js'
const config = definition.config

const urls = config?.turn?.urls || process.env.TURN_URLS?.split(';')
const secret = config?.turn?.secret || process.env.TURN_SECRET
const turnExpireTime = config?.turn?.expire || (+process.env.TURN_EXPIRE) || (60 * 60) // 1 hour for default

const {
  readerRoles = ['reader', 'speaker', 'vip', 'moderator', 'owner'],
  writerRoles = ['speaker', 'vip', 'moderator', 'owner']
} = config

import accessControl from '@live-change/access-control-service/access.js'
const { clientHasAccessRoles } = accessControl(definition)


import { Peer } from './peer.js'

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
  console.log("TURN SECRET", secret, rusername)
  const password = crypto
    .createHmac('sha1', secret)
    .update(rusername)
    .digest('base64')
  /// TODO: select nearest servers by geoip and loadbalancing
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
    const [ channelType, channel, session, instance ] = peer.split(':')
    if(session !== client.session) throw new Error('wrongSession')
    const result = await clientHasAccessRoles(client, { objectType: channelType.split('.')[0], object: channel },
        writerRoles)
    return result
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
