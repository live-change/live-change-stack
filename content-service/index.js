const App = require("@live-change/framework")
const app = App.app()

const definition = require('./definition.js')

const config = definition.config
const {
  contentReaderRoles = ['reader', 'writer'],
  contentWriterRoles = ['writer'],
  contentPublisherRoles = ['writer']
} = config


const { Content, Session, schemas, getDocument } = require("./model.js")
const { Metadata } = require("./metadata.js")
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
    roles: contentReaderRoles
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

const Document = definition.foreignModel("prosemirror", "Document")

definition.view({
  name: "contentPreview",
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
    roles: contentWriterRoles
  },
  daoPath({ objectType, object }, { client, service }, method) {
    const contentId = App.encodeIdentifier([objectType, object])
    return ['database', 'queryObject', app.databaseName, `(${
      async (input, output, { documentTableName, contentId }) => {
        function mapper(obj) {
          return obj && { content: obj.content, timestamp: obj.lastModified }
        }
        await input.table(documentTableName).object(contentId).onChange(async (obj, oldObj) => {
          output.change(mapper(obj), mapper(oldObj))
        })
      }
    })`, { documentTableName: Document.tableName, contentId }]
  }
})

definition.action({
  name: 'publish',
  waitForEvents: true,
  properties: {
    objectType: {
      type: String,
      validation: ['nonEmpty']
    },
    object: {
      type: String,
      validation: ['nonEmpty']
    },
    version: {
      type: Number
    },
    type: {
      type: String
    }
  },
  accessControl: {
    roles: contentPublisherRoles
  },
  async execute({ objectType, object, type, version }, { client, service }, emit) {
    const contentId = App.encodeIdentifier([objectType, object])
    const [contentData, documentData] = await Promise.all([
      Content.get(contentId),
      Document.get(contentId)
    ])
    if(!documentData) throw new Error("Document not found")
    if(version > documentData.version) throw new Error("Version not found")
    await service.triggerService("prosemirror", {
      type: 'takeSnapshot',
      targetType: objectType,
      target: object,
      documentType: type || 'content',
      version
    })
    const snapshotId = App.encodeIdentifier([contentId, version.toFixed().padStart(10, '0')])
    if(contentData) {
      emit({
        type: 'ownerOwnedContentUpdated',
        identifiers: {
          ownerType: objectType, owner: object
        },
        data: {
          snapshot: snapshotId
        }
      })
    } else {
      emit({
        type: 'ownerOwnedContentSet',
        identifiers: {
          ownerType: objectType, owner: object
        },
        data: {
          snapshot: snapshotId
        }
      })
    }
    return 'ok'
  }
})

module.exports = definition
