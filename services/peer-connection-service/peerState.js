import definition from './definition.js'
const config = definition.config
const {
  readerRoles = ['reader', 'speaker', 'vip', 'moderator', 'owner'],
  writerRoles = ['speaker', 'vip', 'moderator', 'owner']
} = config

import accessControl from '@live-change/access-control-service/access.js'
const { clientHasAccessRoles } = accessControl(definition)

import { Peer } from './peer.js'


const peerStateFields = {
  online: {
    type: Boolean
  },
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
    what: Peer,
    singleAccess: () => true
  },
  properties: {
    ...peerStateFields,
    sessionOrUserType: {
      type: String
    },
    sessionOrUser: {
      type: String
    },
  }
})

definition.event({
  name: "peerStateSet",
  async execute({ peer, data }) {
    await PeerState.create({ ...data, id: peer })
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
    const [toType, toId, toSession] = peer.split(':')
    if(client.session !== toSession) return false
    const hasRole = await clientHasAccessRoles(client, { objectType: toType, object: toId }, writerRoles)
    return hasRole
  },
  async execute(props, { client, service }, emit) {
    const [sessionOrUserType, sessionOrUser] =
      client.user ? ['user_User', client.user] : ['session_Session', client.session]
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
