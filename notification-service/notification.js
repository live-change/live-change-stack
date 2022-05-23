const app = require("@live-change/framework").app()

const definition = require('./definition.js')
const config = definition.config

const User = definition.foreignModel('users', 'User')
const Session = definition.foreignModel('session', 'Session')


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
              id: `"${obj.ownerType}":"${obj.owner}"_${obj.id}`,
              ownerType: obj.ownerType, owner: obj.owner,
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
              const { ownerType, owner } = obj || oldObj
              const group = `"${ownerType}":"${owner}"`
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
    await Notification.create(notification, { ...data, id: notification })
  }
})

definition.event({
  name: "marked",
  async execute({ notification, state }) {
    if(state === 'read'){
      await Notification.update(notification, { state: state, readState: state })
    } else {
      await Notification.update(notification, { state })
    }
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
  async execute({ ownerType, owner }) {
    const update = { readState: 'read' }
    const prefix = `"${ownerType}":"${owner}":"new"_`
    console.log("MARK ALL AS READ PREFIX", prefix)
    await app.dao.request(['database', 'query'], app.databaseName, `(${
        async (input, output, { tableName, indexName, update, range }) => {
          await input.index(indexName).range(range).onChange((obj, oldObj) => {
            if(obj) output.table(tableName).update(obj.to, [{ op: 'merge', value: update }])
          })
        }
    })`, {
      tableName: Notification.tableName,
      indexName: Notification.tableName + "_byOwnerAndReadState",
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
  async execute({ ownerType, owner }) {
    const prefix = `"${ownerType}":"${owner}"_`
    console.log("MARK ALL AS READ PREFIX", prefix)
    await app.dao.request(['database', 'query'], app.databaseName, `(${
        async (input, output, { tableName, indexName, update, range }) => {
          await input.index(indexName).range(range).onChange((obj, oldObj) => {
            if(obj) output.table(tableName).delete(obj.to)
          })
        }
    })`, {
      tableName: Notification.tableName,
      indexName: Notification.tableName + "_byOwner",
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
  access: (params, { client }) => !!client.user, // only for logged in
  async daoPath(range, {client, service}, method) {
    const prefix = client.user
        ? ["user_User", client.user]
        : ["session_Session", client.session]
    if(!Number.isSafeInteger(range.limit)) range.limit = 100
    const path = Notification.sortedIndexRangePath('byOwnerAndTime', prefix, range)
    /*const notifications = await app.dao.get(path)
    console.log("NOTIFICATIONS", path,
        "\n  RESULTS", notifications.length, notifications.map(m => m.id))*/
    return Notification.sortedIndexRangePath('byOwnerAndTime', prefix, range)
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
    user: {
      type: User,
    },
    session: {
      type: Session,
    },
    notificationType: {
      type: String,
      validation: ['nonEmpty']
    },
    ...config.fields
  },
  async execute(params , { service }, emit) {
    const { user, session } = params
    if(!user && !session) throw new Error("session or user required")
    const notification = app.generateUid()
    const time = new Date()
    let data = {}
    for(const key in config.fields) data[key] = params[key]
    emit({
      type: "created",
      notification,
      data: { ...data, user, session, time, readState: 'new' }
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
      ? notificationRow.ownerType == 'user_User' && notificationRow.owner == client.user
      : notificationRow.ownerType == 'session_Session' && notificationRow.owner == client.session
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
    const [ ownerType, owner ] = client.user
        ? [ 'user_User', client.user ]
        : [ 'session_Session', client.session ]
    console.log("MARK ALL AS READ!!", ownerType, owner)
    emit({
      type: "allRead",
      ownerType, owner
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
    const [ ownerType, owner ] = client.user
        ? [ 'user_User', client.user ]
        : [ 'session_Session', client.session ]
    console.log("DELETE ALL!!", ownerType, owner)
    emit({
      type: "allDeleted",
      ownerType, owner
    })
  }
})

module.exports = definition
