import definition from './definition.js'
const config = definition.config
const {
  readerRoles = ['reader', 'speaker', 'vip', 'moderator', 'owner'].
  writerRoles = ['speaker', 'vip', 'moderator', 'owner']
} = config

import accessControl from '@live-change/access-control-service/access.js'
const { clientHasAccessRoles } = accessControl(definition)

import { Peer } from './peer.js'


const peerStateFields = {
  audioState: {
    type: String
  },
  videoState: {
    type: String
  }
}

const PeerState = definition.model({
  name: "PeerState",
  propertyOf: {
    what: Peer
  },
  properties: {
    ...peerStateFields
  }
})

definition.event({
  name: "peerStateSet",
  async execute({ peer, data }) {
    await PeerState.create({ ...data, id: peer })
  }
})

definition.view({
  name: "peerState",
  properties: {
    peer: {
      type: Peer
    }
  },
  returns: {
    type: PeerState
  },
  access: async ({ peer }, context) => {
    const { client, service, visibilityTest } = context
    if(visibilityTest) return true
    const [toType, toId, toSession] = peer.split('_')
    return toType.split('.')[0] === 'priv'
        ? checkPrivAccess(toId, context)
        : checkIfRole(toType.split('.')[0], toId, writerRoles, context)
  },
  async daoPath({ peer }, { client, service }, method) {
    return PeerState.path(peer)
  }
})

definition.action({
  name: "setPeerState",
  properties: {
    peer: {
      type: Peer
    },
    ...peerStateFields
  },
  //queuedBy: (command) => `${command.toType}_${command.toId})`,
  access: async ({ peer }, context) => {
    const { client, service, visibilityTest } = context
    if(visibilityTest) return true
    const [toType, toId, toSession] = peer.split('_')
    if(client.session !== toSession) return false
    const hasRole = await clientHasAccessRoles(client, { objectType: toType, object: toId }, writerRoles)
    return hasRole
  },
  async execute(props, { client, service }, emit) {
    let data = { }
    for(const key in peerStateFields) {
      data[key] = props[key]
    }
    emit({
      type: 'peerStateSet',
      peer: props.peer,
      data
    })
    return 'ok'
  }
})
