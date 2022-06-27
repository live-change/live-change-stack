const app = require("@live-change/framework").app()

const definition = require('./definition.js')
const config = definition.config

const Notification = definition.model({
  name: "Notification",
  sessionOrUserItem: {
    sortBy: ['time', 'readState']
  },
  properties: {
    time: {
      type: Date,
      validation: ['nonEmpty']
    },
    state: {
      type: String
    },
    readState: {
      type: String,
      defaultValue: 'new'
    },
    notificationType: {
      type: String,
      validation: ['nonEmpty']
    },
    ...config.fields
  },
  indexes: {
    unreadNotifications: {
      function: async function(input, output) {
        await input.table('notification_Notification')
            .map((obj) => obj && obj.readState == 'new' && ({
              id: `"${obj.sessionOrUserType}":"${obj.sessionOrUser}"_${obj.id}`,
              sessionOrUserType: obj.sessionOrUserType, sessionOrUser: obj.sessionOrUser,
              to: obj.id
            }))
            .to(output)
      }
    },
    unreadNotificationsCount: { /// For counting
      function: async function(input, output) {
        const unreadIndex = await input.index('notification_Notification_unreadNotifications')
        await unreadIndex.onChange(
            async (obj, oldObj) => {
              const { sessionOrUserType, sessionOrUser } = obj || oldObj
              const group = `"${sessionOrUserType}":"${sessionOrUser}"`
              const prefix = group + '_'
              const count = await unreadIndex.count({ gt: prefix, lt: prefix + '\xFF' })
              output.put({
                id: group,
                count
              })
            }
        )
      }
    }
  }
})

definition.event({
  name: "created",
  async execute({ notification, data }) {
    await Notification.create({ ...data, id: notification })
  }
})

definition.event({
  name: "marked",
  async execute({ notification, state }) {
    await Notification.update(notification, { state })
  }
})

definition.event({
  name: "markedRead",
  async execute({ notification }) {
    await Notification.update(notification, { readState: 'read' })
  }
})

definition.event({
  name: "markedUnread",
  async execute({ notification }) {
    await Notification.update(notification, { readState: 'new' })
  }
})

definition.event({
  name: "readState",
  async execute({ notification, readState }) {
    await Notification.update(notification, { readState: readState })
  }
})

definition.event({
  name: "allRead",
  async execute({ sessionOrUserType, sessionOrUser }) {
    const update = { readState: 'read' }
    const prefix = `"${sessionOrUserType}":"${sessionOrUser}":"new"_`
    console.log("MARK ALL AS READ PREFIX", prefix)
    await app.dao.request(['database', 'query'], app.databaseName, `(${
        async (input, output, { tableName, indexName, update, range }) => {
          await input.index(indexName).range(range).onChange((obj, oldObj) => {
            if(obj) output.table(tableName).update(obj.to, [{ op: 'merge', value: update }])
          })
        }
    })`, {
      tableName: Notification.tableName,
      indexName: Notification.tableName + "_bySessionOrUserAndReadState",
      update,
      range: {
        gte: prefix,
        lte: prefix + "\xFF\xFF\xFF\xFF"
      }
    })
  }
})

definition.event({
  name: "allDeleted",
  async execute({ sessionOrUserType, sessionOrUser }) {
    const prefix = `"${sessionOrUserType}":"${sessionOrUser}"_`
    console.log("MARK ALL AS READ PREFIX", prefix)
    await app.dao.request(['database', 'query'], app.databaseName, `(${
        async (input, output, { tableName, indexName, update, range }) => {
          await input.index(indexName).range(range).onChange((obj, oldObj) => {
            if(obj) output.table(tableName).delete(obj.to)
          })
        }
    })`, {
      tableName: Notification.tableName,
      indexName: Notification.tableName + "_bySessionOrUser",
      range: {
        gte: prefix,
        lte: prefix + "\xFF\xFF\xFF\xFF"
      }
    })
  }
})

definition.event({
  name: "deleted",
  async execute({ notification }) {
    await Notification.delete(notification)
  }
})

definition.event({
  name: "emailNotification",
  async execute({ user, notifications }) {
    await Promise.all(notifications.map(notification => Notification.update(notification, { emailState: 'sent' })))
  }
})

definition.view({
  name: "myNotifications",
  properties: {
    ...app.Range
  },
  returns: {
    type: Array,
    of: {
      type: Notification
    }
  },
  autoSlice: true,
  async daoPath(range, {client, service}, method) {
    const prefix = client.user
        ? ["user_User", client.user]
        : ["session_Session", client.session]
    if(!Number.isSafeInteger(range.limit)) range.limit = 100
    const path = Notification.sortedIndexRangePath('bySessionOrUserAndTime', prefix, range)
    /*const notifications = await app.dao.get(path)
    console.log("NOTIFICATIONS", path,
        "\n  RESULTS", notifications.length, notifications.map(m => m.id))*/
    return Notification.sortedIndexRangePath('bySessionOrUserAndTime', prefix, range)
  }
})

definition.view({
  name: "myUnreadCount",
  properties: {
  },
  returns: {
    type: Object
  },
  async daoPath({ }, { client, service }, method) {
    const id = client.user
        ? `"user_User":"${client.user}"`
        : `"session_Session":"${client.session}"`
    console.log("UNREAD", 'unreadNotificationsCount', id)
    return ['database', 'indexObject', app.databaseName, 'notification_Notification_unreadNotificationsCount', id]
  }
})

definition.trigger({
  name: "notify",
  properties: {
    sessionOrUserType: {
      type: String,
      validation: ['nonEmpty']
    },
    sessionOrUser: {
      type: String,
      validation: ['nonEmpty']
    },
    notificationType: {
      type: String,
      validation: ['nonEmpty']
    },
    ...config.fields
  },
  async execute(params , { service }, emit) {
    const { sessionOrUserType, sessionOrUser, notificationType } = params
    if(!sessionOrUserType || !sessionOrUser) throw new Error("session or user required")
    const notification = app.generateUid()
    const time = new Date()
    let data = { notificationType }
    for(const key in config.fields) data[key] = params[key]
    emit({
      type: "created",
      notification,
      data: { ...data, sessionOrUserType, sessionOrUser, time, readState: 'new' }
    })
    await app.trigger({
      type: 'notificationCreated',
      notification,
      ...data
    })
    return notification
  }
})

async function notificationAccess({ notification }, { client, visibilityTest }) {
  if(visibilityTest) return true
  const notificationRow = await Notification.get(notification)
  if(!notificationRow) throw 'notFound'
  return client.user
      ? notificationRow.sessionOrUserType == 'user_User' && notificationRow.sessionOrUser == client.user
      : notificationRow.sessionOrUserType == 'session_Session' && notificationRow.sessionOrUser == client.session
}

definition.action({
  name: "mark",
  properties: {
    notification: {
      type: Notification
    },
    state: {
      type: String
    }
  },
  access: notificationAccess,
  async execute({ notification, state }, { client, service }, emit) {
    emit({
      type: "marked",
      notification,
      state
    })
  }
})

definition.action({
  name: "markRead",
  properties: {
    notification: {
      type: Notification
    }
  },
  access: notificationAccess,
  async execute({notification, state}, {client, service}, emit) {
    emit({
      type: "markedRead",
      notification
    })
  }
})

definition.action({
  name: "markUnread",
  properties: {
    notification: {
      type: Notification
    }
  },
  access: notificationAccess,
  async execute({notification, state}, {client, service}, emit) {
    emit({
      type: "markedUnread",
      notification
    })
  }
})

definition.action({
  name: "toggleReadStatus",
  properties: {
    notification: {
      type: Notification
    },
    read: {
      type: Boolean
    }
  },
  access: notificationAccess,
  async execute({ notification, readState }, { client, service }, emit) {
    emit({
      type: "readState",
      notification,
      readState
    })
  }
})

definition.action({
  name: "markAllAsRead",
  properties: {
  },
  access: async ({}, { client, visibilityTest }) => {
    if(visibilityTest) return true
    return true
  },
  async execute({ notification, readState }, { client, service }, emit) {
    const [ sessionOrUserType, sessionOrUser ] = client.user
        ? [ 'user_User', client.user ]
        : [ 'session_Session', client.session ]
    console.log("MARK ALL AS READ!!", sessionOrUserType, sessionOrUser)
    emit({
      type: "allRead",
      sessionOrUserType, sessionOrUser
    })
  }
})

definition.action({
  name: "delete",
  properties: {
    notification: {
      type: Notification
    }
  },
  access: notificationAccess,
  async execute({ notification }, { client, service }, emit) {
    emit({
      type: "deleted",
      notification
    })
  }
})

definition.action({
  name: "deleteAll",
  properties: {
  },
  access: async ({}, { client, visibilityTest }) => {
    if(visibilityTest) return true
    return true
  },
  async execute({ notification, readState }, { client, service }, emit) {
    const [ sessionOrUserType, sessionOrUser ] = client.user
        ? [ 'user_User', client.user ]
        : [ 'session_Session', client.session ]
    console.log("DELETE ALL!!", sessionOrUserType, sessionOrUser)
    emit({
      type: "allDeleted",
      sessionOrUserType, sessionOrUser
    })
  }
})

module.exports = definition
