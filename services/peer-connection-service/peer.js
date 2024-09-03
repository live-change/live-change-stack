import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
const config = definition.config
const {
  readerRoles = ['reader', 'speaker', 'vip', 'moderator', 'owner', 'member'].
  writerRoles = ['speaker', 'vip', 'moderator', 'owner']
} = config

import accessControl from '@live-change/access-control-service/access.js'
const { clientHasAccessRoles } = accessControl(definition)

export const Peer = definition.model({
  name: "Peer",
  itemOfAny: {
    to: ['channel', 'session']
  },
  properties: {
  }
})

definition.view({
  name: "peers",
  properties: {
    channelType: {
      type: String,
      validation: ['nonEmpty']
    },
    channel: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  returns: {
    type: Array,
    of: {
      type: Peer
    }
  },
  access: (params, { client, visibilityTest }) => {
    if(visibilityTest) return true
    const { channelType, channel } = params
    //console.log("CHECK PEERS ACCESS", params, client, visibilityTest)
    return clientHasAccessRoles(client, { objectType: channelType, object: channel }, readerRoles)
  },
  async daoPath({ channelType, channel }, { client, service }, method) {
    return Peer.indexRangePath('byChannel', [ channelType, channel.split('.')[0] ])
  }
})

definition.event({
  name: "peerOnline",
  async execute({ channelType, channel, session, instance }) {
    const peer = channelType + ':' + channel + ':' + session + ':' + instance
    await Peer.create({ id: peer, channelType, channel, instance, session })
  }
})

definition.event({
  name: "peerOffline",
  async execute({ channelType, channel, session, instance }) {
    const peer = channelType + ':' + channel + ':' + session + ':' + instance
    Peer.delete(peer)
  }
})

definition.event({
  name: "allOffline",
  async execute() {
    await app.dao.request(['database', 'query', app.databaseName, `(${
        async (input, output, { table }) => {
          await input.table(table).range({}).onChange(async obj => {
            output.table(table).delete(obj.id)
          })
        }
    })`, { table: Peer.tableName }])
  }
})

definition.trigger({
  name: "sessionPeerOnline",
  properties: {
  },
  async execute({ session, peer }, context, emit) {
    console.log("PEER ONLINE PARAMS", { session, peer })
    const [ channelType, channel, peerSession, instance ] = peer.split(':')
    if(peerSession !== session) throw new Error('wrongSession')
    /// TODO: check channel access
    emit({
      type: 'peerOnline',
      channelType, channel, session, instance
    })
  }
})

definition.trigger({
  name: "sessionPeerOffline",
  properties: {
  },
  async execute({ session, peer }, context, emit) {
    console.log("PEER OFFLINE PARAMS", { session, peer })
    const [ channelType, channel, peerSession, instance ] = peer.split(':')
    if(peerSession !== session) throw new Error('wrongSession')
    emit({
      type: 'peerOffline',
      channelType, channel, session, instance
    })
  }
})

definition.trigger({
  name: "allOffline",
  properties: {
  },
  async execute({ }, context, emit) {
    emit({
      type: "allOffline"
    })
  }
})
