const app = require("@live-change/framework").app()

const definition = require('./definition.js')
const config = definition.config

const User = definition.foreignModel('users', 'User')
const Session = definition.foreignModel('session', 'Session')


const Notification = definition.model({
  name: "Notification",
  properties: {
    session: {
      type: Session,
    },
    user: {
      type: User,
    },
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
    userNotifications: {
      property: ["user", "time"]
    },
    userNotificationsByReadState: {
      property: ["user", "readState"]
    },
    sessionNotifications: {
      property: ["session", "time"]
    },
    sessionNotificationsByReadState: {
      property: ["session", "readState"]
    },
    userUnreadNotifications: {
      function: async function(input, output) {
        const mapper =
            (obj) => obj && obj.readState == 'new' && obj.user &&
                ({ id: `${obj.user}_${obj.id}`, user: obj.user, to: obj.id })
        await input.table('notification_Notification').onChange(
            (obj, oldObj) => output.change(obj && mapper(obj), oldObj && mapper(oldObj))
        )
      }
    },
    userUnreadNotificationsCount: { /// For counting
      function: async function(input, output) {
        const unreadIndex = await input.index('notification_Notification_userUnreadNotifications')
        await unreadIndex.onChange(
            async (obj, oldObj) => {
              const user = (obj && obj.user) || (oldObj && oldObj.user)
              const count = await unreadIndex.count({
                gt: user + '_',
                lt: user + '_\xFF'
              })
              output.put({
                id: user,
                count
              })
            }
        )
      }
    },
    sessionUnreadNotifications: {
      function: async function(input, output) {
        const mapper =
            (obj) => obj.readState == 'new' && obj.session &&
                ({ id: `${obj.session}_${obj.id}`, session: obj.session, to: obj.id })
        await input.table('notification_Notification').onChange(
            (obj, oldObj) => output.change(obj && mapper(obj), oldObj && mapper(oldObj))
        )
      }
    },
    sessionUnreadNotificationsCount: { /// For counting
      function: async function(input, output) {
        const unreadIndex = await input.index('notification_Notification_sessionUnreadNotifications')
        await unreadIndex.onChange(
            async (obj, oldObj) => {
              const session = (obj && obj.session) || (oldObj && oldObj.session)
              const count = await unreadIndex.count({
                gt: session + '_',
                lt: session + '_\xFF'
              })
              output.put({
                id: session,
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
  async execute({ user, session }) {
    const update = { readState: 'read' }
    const prefix = user
        ? JSON.stringify(user) + ':"new"_'
        : JSON.stringify(session) + ':"new"_'
    console.log("MARK ALL AS READ PREFIX", prefix)
    await app.dao.request(['database', 'query'], app.databaseName, `(${
        async (input, output, { tableName, indexName, update, range }) => {
          await input.index(indexName).range(range).onChange((obj, oldObj) => {
            if(obj) output.table(tableName).update(obj.to, [{ op: 'merge', value: update }])
          })
        }
    })`, {
      tableName: Notification.tableName,
      indexName: user
          ? Notification.tableName + "_userNotificationsByReadState"
          : Notification.tableName + "_sessionNotificationsByReadState",
      update,
      range: {
        gte: prefix,
        lte: prefix + "\xFF\xFF\xFF\xFF"
      }
    })
  }
})

definition.event({
  name: "allRemoved",
  async execute({ user, session }) {
    const prefix = user
        ? JSON.stringify(user) + ':'
        : JSON.stringify(session) + ':'
    console.log("MARK ALL AS READ PREFIX", prefix)
    await app.dao.request(['database', 'query'], app.databaseName, `(${
        async (input, output, { tableName, indexName, update, range }) => {
          await input.index(indexName).range(range).onChange((obj, oldObj) => {
            if(obj) output.table(tableName).delete(obj.to)
          })
        }
    })`, {
      tableName: Notification.tableName,
      indexName: user
          ? Notification.tableName + "_userNotificationsByReadState"
          : Notification.tableName + "_sessionNotificationsByReadState",
      range: {
        gte: prefix,
        lte: prefix + "\xFF\xFF\xFF\xFF"
      }
    })
  }
})

definition.event({
  name: "removed",
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
    const [index, prefix] = client.user
        ? ['userNotifications', `"${client.user}"`]
        : ['sessionNotifications', `"${client.session}"`]
    if(!Number.isSafeInteger(range.limit)) range.limit = 100
    const notifications = await Notification.sortedIndexRangeGet(index, prefix, range)
    console.log("MESSAGES RANGE", JSON.stringify({ user: client.user, gt, lt, gte, lte, limit, reverse }) ,
        "\n  TO", JSON.stringify(range),
        "\n  RESULTS", notifications.length, notifications.map(m => m.id))
    return Notification.sortedIndexRangePath(index, range)
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
    const [index, id] = client.user
        ? ['userUnreadNotificationsCount', `${client.user}`]
        : ['sessionUnreadNotificationsCount', `${(await getPublicInfo(client.sessionId)).id}`]
    console.log("UNREAD", index, id)
    return ['database', 'indexObject', app.databaseName, 'notifications_Notification_'+index, id]
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
  access: async ({ notification }, { client, visibilityTest }) => {
    if(!client.user) return false
    if(visibilityTest) return true
    const notificationRow = await Notification.get(notification)
    if(!notificationRow) throw 'notFound'
    return client.user
        ? notificationRow.user == client.user
        : notificationRow.session == (await getPublicInfo(client.sessionId)).id
  },
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
  access: async ({ notification }, { client, visibilityTest }) => {
    if(!client.user) return false
    if(visibilityTest) return true
    const notificationRow = await Notification.get(notification)
    if(!notificationRow) throw 'notFound'
    return client.user
        ? notificationRow.user == client.user
        : notificationRow.session == (await getPublicInfo(client.sessionId)).id
  },
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
    if(!client.user) return false
    if(visibilityTest) return true
    return true
  },
  async execute({ notification, readState }, { client, service }, emit) {
    const user = client.user
    const session = (await getPublicInfo(client.sessionId)).id
    console.log("MARK ALL AS READ!!", user, session)
    emit({
      type: "allRead",
      user,
      session
    })
  }
})

definition.action({
  name: "remove",
  properties: {
    notification: {
      type: Notification
    }
  },
  access: async ({ notification }, { client, visibilityTest }) => {
    if(!client.user) return false
    if(visibilityTest) return true
    const notificationRow = await Notification.get(notification)
    if(!notificationRow) throw 'notFound'
    return client.user
        ? notificationRow.user == client.user
        : notificationRow.session == (await getPublicInfo(client.sessionId)).id
  },
  async execute({ notification }, { client, service }, emit) {
    emit({
      type: "removed",
      notification
    })
  }
})

definition.action({
  name: "removeAll",
  properties: {
  },
  access: async ({}, { client, visibilityTest }) => {
    if(!client.user) return false
    if(visibilityTest) return true
    return true
  },
  async execute({ notification, readState }, { client, service }, emit) {
    const user = client.user
    const session = (await getPublicInfo(client.sessionId)).id
    console.log("REMOVE ALL!!", user, session)
    emit({
      type: "allRemoved",
      user,
      session
    })
  }
})

module.exports = definition
