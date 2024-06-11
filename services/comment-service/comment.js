import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
const config = definition.config

import { encodeDate } from '@live-change/uid'

const {
  contentObject = false,
  commentProperties = {},
  adminRoles = ['administrator', 'admin'],
  moderatorRoles = ['administrator', 'admin', 'moderator'],
  editExpire = 1000 * 60 * 60 * 15 // 15 minutes
} = config
const {
  readAccessControl,
  createAccessControl,
  updateAccessControl,
  deleteAccessControl,
} = config
const {
  readAccess = readAccessControl ? undefined
    : () => true,
  createAccess = createAccessControl ? undefined
    : () => true,
  updateAccess = updateAccessControl ? undefined
    : ({ comment }, { client, visibilityTest }) => {
      if(visibilityTest) return true
      if(client.roles.some(role => adminRoles.includes(role))) return true
      if(!editExpire || Date.now() - new Date(comment.createdAt).getDate() > editExpire) return false
      if(comment.authorType === 'session_Session' && comment.author === client.session) return true
      if(comment.authorType === 'user_User' && comment.author === client.user) return true
      return false
    },
  deleteAccess = (params, { client }) =>
    client.roles.some(role => adminRoles.includes(role)) || client.roles.some(role => moderatorRoles.includes(role))
} = config

const Comment = definition.model({
  name: 'Comment',
  itemOfAny: {
    to: 'cause',
    readAccess,
    createAccess,
    updateAccess,
    deleteAccess,
    readAccessControl,
    createAccessControl,
    updateAccessControl,
    deleteAccessControl
  },
  properties: {
    content: contentObject ? {
      type: Object, // TODO: prosemirror based validation
      validation: ['nonEmpty']
    } : {
      type: String,
      validation: ['nonEmpty']
    },
    createdAt: {
      default: () => new Date()
    },
    updatedAt: {
      updated: () => new Date()
    },
    ...commentProperties
  },
  saveAuthor: true,
  saveUpdater: true,
  indexes: {
    byAuthor: {
      property: ['authorType', 'author']
    },
    byRoot: {
      function: async function(input, output, { tableName }) {
        async function findRoot(object){
          let current = object
          while(current) {
            if(current.causeType !== tableName) return `"${current.causeType}":"${current.cause}"`
            current = await input.table(tableName).object(current.cause).get()
          }
        }
        await input.table(tableName).onChange(async (obj, oldObj) => {
          const id = obj?.id || oldObj?.id
          const root = obj ? await findRoot(obj) : []
          const oldRoot = oldObj ? await findRoot(oldObj) : []
          //console.log("ROOT", id, oldRoot, '=>', root)
          if(root !== oldRoot) {
            if(oldRoot) {
              await output.change(null, { id: `${oldRoot}_${id}`, to: id })
            }
            if(root) {
              await output.change({ id: `${root}_${id}`, to: id }, null)
            }
          }
        })
      },
      parameters: {
        tableName: definition.name + '_Comment'
      }
    },
    byRootAndDates: {
      function: async function(input, output, { tableName }) {
        async function findRoot(object) {
          let current = object
          const dates = []
          while(current) {
            if(current.causeType !== tableName)
              return `"${current.causeType}":"${current.cause}:${dates.join('-')}"`
            current = await input.table(tableName).object(current.cause).get()
            if(current.causeType === tableName) {
              dates.push(encodeDate(current.createdAt))
            }
          }
        }
        await input.table(tableName).onChange(async (obj, oldObj) => {
          const id = obj?.id || oldObj?.id
          const root = obj ? await findRoot(obj) : []
          const oldRoot = oldObj ? await findRoot(oldObj) : []
          //console.log("ROOT", id, oldRoot, '=>', root)
          if(root !== oldRoot) {
            if(oldRoot) {
              await output.change(null, { id: `${oldRoot}_${id}`, to: id })
            }
            if(root) {
              await output.change({ id: `${root}_${id}`, to: id }, null)
            }
          }
        })
      },
      parameters: {
        tableName: definition.name + '_Comment'
      }
    }
  }
})

definition.view({
  name: 'commentsByAuthor',
  internal: true,
  properties: {
    authorType: {
      type: String
    },
    author: {
      type: String
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Comment
    }
  },
  async daoPath(props, { client }) {
    const range = App.extractRange(props)
    if(range.limit === undefined) range.limit = 256
    return Comment.indexRangePath('byAuthor', [authorType, author], {  })
  }
})

definition.view({
  name: 'commentsByRoot',
  properties: {
    rootType: {
      type: String,
      validation: ['nonEmpty']
    },
    root: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Comment
    }
  },
  async daoPath(props) {
    const { rootType, root } = props
    const range = App.extractRange(props)
    if(!range.limit) range.limit = 256
    return Comment.indexRangePath('byRoot', [rootType, root], range)
  }
})

definition.view({
  name: 'commentsByRootGroupedByDates',
  properties: {
    rootType: {
      type: String,
      validation: ['nonEmpty']
    },
    root: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Comment
    }
  },
  async daoPath(props) {
    const { rootType, root } = props
    const range = App.extractRange(props)
    if(!range.limit) range.limit = 256
    return Comment.indexRangePath('byRootAndDates', [rootType, root], range)
  }
})

