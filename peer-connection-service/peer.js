const definition = require('./definition.js')

const { clientHasAccessRole } = require("../access-control-service/access.js")(definition)

const Peer = definition.model({
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
    return clientHasAccessRole(client, { objectType: channelType, object: channel },
        ['reader', 'speaker', 'vip', 'moderator', 'owner'])
  },
  async daoPath({ channelType, channel }, { client, service }, method) {
    return Peer.indexRangePath('byChannel', [ channelType, channel.split('.')[0] ])
  }
})

definition.event({
  name: "peerOnline",
  async execute({ channelType, channel, sessionType, session, instance }) {
    const peer = channelType + ':' + channel + ':' + sessionType + ':' + session + ':' + instance
    await Peer.create({ id: peer, channelType, channel, instance, sessionType, session })
  }
})

definition.event({
  name: "peerOffline",
  async execute({ channelType, channel, sessionType, session, instance }) {
    const peer = channelType + ':' + channel + ':' + sessionType + ':' + session + ':' + instance
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
    const [ channelType, channel, sessionType, peerSession, instance ] = peer.split(':')
    if(sessionType != 'session_Session') throw new Error('wrongSessionType')
    if(peerSession != session) throw new Error('wrongSession')
    /// TODO: check channel access
    emit({
      type: 'peerOnline',
      channelType, channel, sessionType, session, instance
    })
  }
})

definition.trigger({
  name: "sessionPeerOffline",
  properties: {
  },
  async execute({ session, peer }, context, emit) {
    console.log("PEER OFFLINE PARAMS", { session, peer })
    const [ channelType, channel, sessionType, peerSession, instance ] = peer.split(':')
    if(sessionType != 'session_Session') throw new Error('wrongSessionType')
    if(peerSession != session) throw new Error('wrongSession')
    emit({
      type: 'peerOffline',
      channelType, channel, sessionType, session, instance
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
