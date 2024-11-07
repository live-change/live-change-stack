import definition from './definition.js'
const config = definition.config
const {
  readerRoles = ['reader', 'speaker', 'vip', 'moderator', 'owner'],
  writerRoles = ['speaker', 'vip', 'moderator', 'owner']
} = config


import accessControl from '@live-change/access-control-service/access.js'
const { clientHasAccessRoles } = accessControl(definition)

import { Peer } from './peer.js'

const messageFields = {
  to: {
    type: Peer
  },
  from: {
    type: Peer
  },
  type: {
    type: String
  },
  data: {
    type: Object
  },
  sent: {
    type: Date
  }
}

const Message = definition.model({
  name: "Message",
  properties: {
    timestamp: {
      type: Date,
      validation: ['nonEmpty']
    },
    ...messageFields
  },
  indexes: {
    /*byToTimestamp: {
      property: ['to', 'timestamp']
    },*/
  },
  crud: {
    deleteTrigger: true,
    writeOptions: {
      access: (params, {client, service}) => {
        return client.roles.includes('admin')
      }
    }
  }
})

definition.view({
  name: "messages",
  properties: {
    peer: {
      type: Peer
    },
    gt: {
      type: String,
    },
    lt: {
      type: String,
    },
    gte: {
      type: String,
    },
    lte: {
      type: String,
    },
    limit: {
      type: Number
    },
    reverse: {
      type: Boolean
    }
  },
  returns: {
    type: Array,
    of: {
      type: Message
    }
  },
  access: async({ peer }, { client, service, visibilityTest }) => {
    if(visibilityTest) return true
    if(!peer) throw new Error("peer parameter is required")
    console.log('MESSAGES ACCESS', peer.split(':'), "[2] == ", client.session)
    return peer.split(':')[2] === client.session
  },
  async daoPath({ peer, gt, lt, gte, lte, limit, reverse }, { client, service }, method) {
    const channelId = peer
    if(!Number.isSafeInteger(limit)) limit = 100
    const range = {
      gt: gt ? `${channelId}_${gt.split('_').pop()}` : (gte ? undefined : `${channelId}_`),
      lt: lt ? `${channelId}_${lt.split('_').pop()}` : undefined,
      gte: gte ? `${channelId}_${gte.split('_').pop()}` : undefined,
      lte: lte ? `${channelId}_${lte.split('_').pop()}` : ( lt ? undefined : `${channelId}_\xFF\xFF\xFF\xFF`),
      limit,
      reverse
    }
    const messages = await Message.rangeGet(range)
    console.log("MESSAGES RANGE", JSON.stringify({ peer, gt, lt, gte, lte, limit, reverse }) ,
        "\n  TO", JSON.stringify(range),
        "\n  RESULTS", messages.length, messages.map(m => m.id))

    /* console.log("MESSAGES RANGE", range, "RESULTS", messages.length)*/
    return Message.rangePath(range)
  }
})

let lastMessageTime = new Map()

function postMessage(props, { client, service }, emit, conversation) {
  console.log("POST MESSAGE", props)
  const channelId = props.to
  let lastTime = lastMessageTime.get(channelId)
  const now = new Date()
  if(lastTime && now.toISOString() <= lastTime.toISOString()) {
    lastTime.setTime(lastTime.getTime() + 1)
  } else {
    lastTime = now
  }
  if(lastTime.getTime() > now.getTime() + 100) { /// Too many messages per second, drop message
    return;
  }
  lastMessageTime.set(channelId, lastTime)
  const message = `${channelId}_${lastTime.toISOString()}`
  let data = {}
  for(const key in messageFields) {
    data[key] = props[key]
  }
  data.timestamp = now
  if(!data.user) {
    data.session = client.session
  }
  emit({
    type: "MessageCreated",
    message,
    data
  })
}

definition.action({
  name: "postMessage",
  properties: {
    ...messageFields
  },
  //queuedBy: (command) => `${command.toType}_${command.toId})`,
  access: async ({ from, to }, context) => {
    const { client, service, visibilityTest } = context
    if(visibilityTest) return true
    const [fromType, fromId, fromSession] = from.split(':')
    const [toType, toId, toSession] = to.split(':')
    console.log("POST MESSAGE", fromType, fromId, fromSession, '=>', toType, toId, toSession, "BY", client)
    if(toType !== fromType || toId !== fromId) return false // different channel
    if(client.session !== fromSession) return false
    const hasRole = await clientHasAccessRoles(client, { objectType: toType, object: toId }, writerRoles)
    return hasRole
  },
  queuedBy: (props) => props.to, // without this, messages order can be changed, it will block ice connection state
  async execute(props, { client, service }, emit) {
    throw new Error('postMessage is deprecated, use postMessages instead')
    const result = postMessage(props, { client, service }, emit)
    console.log("MESSAGE POSTED!")
    return result
  }
})


definition.action({
  name: "postMessages",
  properties: {
    from: {
      type: Peer,
      validation: ['nonEmpty']
    },
    to: {
      type: Peer,
      validation: ['nonEmpty']
    },
    messages: {
      type: Array,
      of: {
        type: Object,
        messageFields
      }
    }
  },
  //queuedBy: (command) => `${command.toType}_${command.toId})`,
  access: async ({ from, to }, context) => {
    const { client, service, visibilityTest } = context
    if(visibilityTest) return true
    const [fromType, fromId, fromSession] = from.split(':')
    const [toType, toId, toSession] = to.split(':')
   // console.log("POST MESSAGE", fromType, fromId, fromSession, '=>', toType, toId, toSession, "BY", client)
    if(toType !== fromType || toId !== fromId) return false // different channel
    if(client.session !== fromSession) return false
    const hasRole = await clientHasAccessRoles(client, { objectType: toType, object: toId }, writerRoles)
    return hasRole
  },
  queuedBy: (props) => props.from+':'+props.to, // without this, messages order can be changed
                                                      // and it will block ice connection state
  //waitForEvents: true,
  async execute(props, { client, service }, emit) {
    const lastMessages = await Message.rangeGet({
      gte: `${props.to}_`,
      lte: `${props.to}_\xFF\xFF\xFF\xFF`,
      limit: 10,
      reverse: true
    })
    let lastSent = lastMessages?.[0]?.sent
    const messages = props.messages
    for(const message of messages) {
      message.from = props.from
      message.to = props.to
      const sent = new Date(message.sent).toISOString()
      if(lastSent > sent) {
        console.error("Message out of order", lastSent, '>', sent, "BY", props.from)
        console.error("LAST MESSAGES", lastMessages)
        console.error("RECEIVED MESSAGES", props.messages)
       // process.exit(1)
        throw new Error("Messages out of order")
      }
      lastSent = sent
    }
    for(const message of messages) {
      postMessage(message, { client, service }, emit)
    }
   // console.log("MESSAGES POSTED!")
    return 'ok'
  }
})
