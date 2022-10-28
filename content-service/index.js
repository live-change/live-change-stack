const App = require("@live-change/framework")
const app = App.app()

const definition = require('./definition.js')

const config = definition.config
const {
  contentReaderRoles = ['reader'],
  contentWriterRoles = ['writer']
} = config


const { Content, Session } = require("./model.js")
const Snapshot = definition.foreignModel("prosemirror", "Snapshot")

definition.view({
  name: "content",
  properties: {
    objectType: {
      type: String,
      validation: ['nonEmpty']
    },
    object: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  returns: {
    type: Object,
    properties: {
      content: {
        type: Object,
      },
      timestamp: {
        type: Date
      }
    }
  },
  accessControl: {
    roles: ['reader']
  },
  daoPath({ objectType, object }, { client, service }, method) {
    const contentId = App.encodeIdentifier([objectType, object])
    return ['database', 'queryObject', app.databaseName, `(${
      async (input, output, { contentTableName, snapshotTableName, contentId }) => {
        const snapshotTable = input.table(snapshotTableName)
        let storedSnapshotId = undefined
        await input.table(contentTableName).object(contentId).onChange(async (obj, oldObj) => {
          const snapshot = obj && await snapshotTable.object(obj.snapshot).get()
          const oldSnapshot = storedSnapshotId && await snapshotTable.object(storedSnapshotId).get()
          const newResult = snapshot && {
            content: snapshot.content,
            timestamp: snapshot.timestamp
          }
          const oldResult = oldSnapshot && {
            content: oldSnapshot.content,
            timestamp: oldSnapshot.timestamp
          }
          output.change(newResult, oldResult)
          storedSnapshotId = obj?.snapshot
        })
      }
    })`, { contentTableName: Content.tableName, snapshotTableName: Snapshot.tableName, contentId }]
  }
})


module.exports = definition
