const Peer = require('./peer.js')

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
    const publicSessionInfo = await getPublicInfo(client.sessionId)
    //console.log('MESSAGES ACCESS', peer.split('_'), "[2] == ", publicSessionInfo.id)
    return peer.split('_')[2] == publicSessionInfo.id
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

async function postMessage(props, { client, service }, emit, conversation) {
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
    const publicInfo = await getPublicInfo(client.sessionId)
    data.session = publicInfo.id
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
    const [fromType, fromId, fromSession] = from.split('_')
    const [toType, toId, toSession] = to.split('_')
    if(toType != fromType) return false
    if(toId != fromId) return false
    const publicSessionInfo = await getPublicInfo(client.sessionId)
    if(publicSessionInfo.id != fromSession) return false
    return toType.split('.')[0] == 'priv'
        ? checkPrivAccess(toId, context)
        : checkIfRole(toType.split('.')[0], toId, ['speaker', 'vip', 'moderator', 'owner'], context)
  },
  async execute(props, { client, service }, emit) {
    const result = await postMessage(props, { client, service }, emit)
    console.log("MESSAGE POSTED!")
    return result
  }
})
