const definition = require('./definition.js')

const Upload = definition.model({
  name: 'Upload',
  properties: {
    purpose: {
      type: String
    },
    fileName: {
      type: String
    },
    internalName: {
      type: String
    },
    lastUpdate: {
      type: Date
    },
    state: {
      type: String
    },
    progress: {
      type: Object,
      props: {
        percentage: {
          type: Number
        },
        transferred: {
          type: Number
        },
        length: {
          type: Number
        },
        remaining: {
          type: Number
        },
        eta: {
          type: Number
        },
        runtime: {
          type: Number
        },
        delta: {
          type: Number
        },
        speed: {
          type: Number
        }
      }
    }
  }
})

definition.event({
  name: "uploadStarted",
  async execute({ upload, purpose, fileName, internalName }) {
    await Upload.update(upload, [
      { op: 'reverseMerge', value: { id: upload, purpose, fileName, internalName, state: 'started' } },
    ])
  }
})

definition.event({
  name: "uploadFailed",
  async execute({ upload }) {
    await Upload.update(upload, [
      { op: 'reverseMerge', value: { id: upload, state: 'failed' } },
    ])
  }
})

definition.event({
  name: "uploadFinished",
  async execute({ upload }) {
    await Upload.update(upload, [
      { op: 'reverseMerge', value: { id: upload, state: 'done' } },
    ])
  }
})

definition.event({
  name: "uploadUsed",
  async execute({ upload }) {
    await Upload.delete(upload)
  }
})

definition.view({
  name: 'upload',
  properties: {
    upload: {
      type: Upload,
      validation: ['nonEmpty']
    }
  },
  returns: {
    type: Upload
  },
  daoPath({ upload }, { client, context }) {
    return Upload.path( upload )
  }
})

definition.trigger({
  name: "uploadUsed",
  properties: {
    upload: {
      type: Upload
    }
  },
  async execute({ upload }, context, emit) {
    emit({
      type: 'uploadUsed',
      upload
    })
  }
})


module.exports = { Upload }