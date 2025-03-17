import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config

import { parentsSources } from './accessControlParents.js'

const AccessParent = definition.model({
  name: "AccessParent",
  properties: {
    childType: {
      type: String
    },
    property: {
      type: String
    },
    type: {
      type: String
    },
    possibleTypes: {
      type: Array,
      of: {
        type: String
      }
    }
  }
})

definition.afterStart(async () => {
  const destObjects =
    Object.entries(parentsSources)
      .flatMap(([childType, properties]) =>
        properties.map(property => ({
          id: `${childType}.${property.property}`,
          childType,
          ...property
        }))
      )
  let idsSet = new Set(destObjects.map(obj => obj.id))
  const existingParents = await AccessParent.rangeGet({})
  const promises = []
  for(const obj of destObjects) {
    promises.push(AccessParent.create(obj))
  }
  for(const parent of existingParents) {
    if(!idsSet.has(parent.id)) {
      promises.push(AccessParent.delete(parent.id))
    }
  }
  await Promise.all(promises)
})

if(config.indexed) {

  definition.index({
    name: 'childByParent',
    async function(input, output,
                   { accessParentTableName }) {

      const reindexerBucket = 128

      function indexEntry(parentType, childType, parent, child, property) {
        const indexPart = [parentType, parent, childType, child]
          .map(v => JSON.stringify(v)).join(':')
        return {
          id: indexPart + '_' + property,
          parentType,
          parent,
          childType,
          child,
          property
        }
      }

      function indexEntryByProperty(childType, item, property) {
        const value = item?.[property.property]
        if(!value) return
        const type = property.type || item[property.property + 'Type']
        return indexEntry(type, childType, value, item.id, property.property)
      }

      class TableIndexer {
        constructor(childType, properties) {
          this.childType = childType
          this.properties = properties
          this.removedProperties = []
          this.table = input.table(childType)
          this.promise = this.table.onChange(async (item, oldItem) => await this.index(item, oldItem))
        }

        async removeProperty(property) {
          const index = this.properties.indexOf(property)
          if(index >= 0) {
            this.properties.splice(index, 1)
            this.removedProperties.push(property)
            await this.reindex()
            this.removedProperties.splice(this.removedProperties.indexOf(property), 1)
          }
        }

        async addProperty(property) {
          this.properties.push(property)
          await this.reindex()
        }

        async reindex() {
          let position = ''
          while(true) {
            const bucket = await this.table.get({
              gt: position,
              limit: reindexerBucket
            })
            for(const item of bucket) await this.index(item)
            if(bucket.length < reindexerBucket) break
          }
        }

        async index(item, oldItem) {
          output.debug("!!!", item, oldItem, this.properties)
          for(const property of this.removedProperties) {
            await output.remove(indexEntryByProperty(this.childType, item, property))
          }
          for(const property of this.properties) {
            const newEntry = indexEntryByProperty(this.childType, item, property)
            const oldEntry = indexEntryByProperty(this.childType, oldItem, property)
            output.debug('<-->', newEntry, oldEntry)
            if(newEntry || oldEntry) await output.change(newEntry, oldEntry)
          }
        }
      }

      const tableIndexers = new Map()

      async function addParentProperty(property) {
        let indexer = tableIndexers.get(property.childType)
        if(!indexer) {
          indexer = new TableIndexer(property.childType, [property.property])
          tableIndexers.set(property.childType, indexer)
          await indexer.promise
        }
        await indexer.addProperty(property)
      }

      function removeParentProperty(property) {
        let indexer = tableIndexers.get(property.childType)
        if(!indexer) return
        indexer.removeProperty(property)
      }

      const accessParentTable = input.table(accessParentTableName)
      let parentsLoaded = false
      await accessParentTable.onChange((parentProperty, oldParentProperty) => {
        if(!parentsLoaded) return
        if(oldParentProperty && !parentProperty) removeParentProperty(oldParentProperty)
        if(parentProperty) addParentProperty(parentProperty)
      })
      const initialParentsState = await accessParentTable.get({})
      const propertiesByChildType = new Map()
      for(const parentProperty of initialParentsState) {
        const properties = propertiesByChildType.get(parentProperty.childType) || []
        properties.push(parentProperty)
        propertiesByChildType.set(parentProperty.childType, properties)
      }
      const indexerPromises = []
      for(const [childType, properties] of propertiesByChildType) {
        const indexer = new TableIndexer(childType, properties)
        tableIndexers.set(childType, indexer)
        indexerPromises.push(indexer.promise)
      }
      parentsLoaded = true
      await Promise.all(indexerPromises)
    },
    parameters: {
      accessParentTableName: definition.name + '_AccessParent'
    }
  })

  definition.index({
    name: 'parentByChild',
    dependencies: ['childByParent'],
    async function(input, output, { childByParentIndexName }) {
      function mapper(entry) {
        if(!entry) return null
        const { parentType, parent, childType, child, property } = entry
        const indexPart = [childType, child, parentType, parent]
          .map(v => JSON.stringify(v)).join(':')
        return {
          ...entry,
          id: indexPart + '_' + property,
        }
      }

      const childByParentIndex = await input.index(childByParentIndexName)
      await childByParentIndex.onChange(async (entry, oldEntry) =>
        await output.change(mapper(entry), mapper(oldEntry))
      )
    },
    parameters: {
      childByParentIndexName: definition.name + '_childByParent'
    }
  })

  definition.index({
    name: 'pathsByAncestorDescendantRelation',
    dependencies: ['childByParent', 'parentByChild'],
    async function(input, output, { childByParentIndexName, parentByChildIndexName }) {
      const childByParentIndex = await input.index(childByParentIndexName)
      const parentByChildIndex = await input.index(parentByChildIndexName)

      const bucketSize = 128

      async function iterate(index, prefix, cb) {
        let position = prefix + ':'
        while(true) {
          const bucket = await index.get({
            gt: position,
            lte: prefix + '_\xFF\xFF\xFF\xFF',
            limit: bucketSize
          })
          for(const entry of bucket) await cb(entry)
          if(bucket.length < bucketSize) break
          position = bucket[bucket.length - 1].id
        }
      }

      async function propagateChange(create, ancestorType, ancestor, descendantType, descendant,
                                     intermediate = []) {
        if(ancestorType === descendantType && ancestor === descendant) {// break recursion cycle
          output.debug("FOUND PARENT RECURSION", ancestorType, ancestor, intermediate)
          return
        }
        //output.debug("PROPAGATE", create, ancestorType, ancestor, descendantType, descendant, intermediate)
        const hash = sha1([...intermediate].join('>'), 'base64')
        const pathId = [ancestorType, ancestor, descendantType, descendant].map(v => JSON.stringify(v))
          .join(':') + '_' + hash
        const exists = await output.objectGet(pathId)
        if(create === exists) return // no change
        const entry = {
          id: pathId,
          ancestorType, ancestor, descendantType, descendant, intermediate, hash
        }
        if(create) {
          await output.put(entry)
        } else {
          await output.delete(entry)
        }
        const descendantPrefix = [descendantType, descendant].map(v => JSON.stringify(v)).join(':')
        const ancestorPrefix = [ancestorType, ancestor].map(v => JSON.stringify(v)).join(':')
        await iterate(childByParentIndex, descendantPrefix, async descendantChild => {
          await propagateChange(create,
            ancestorType, ancestor, descendantChild.childType, descendantChild.child,
            [...intermediate, descendantPrefix, descendantChild.property])
        })
        await iterate(parentByChildIndex, ancestorPrefix, async ancestorParent => {
          await propagateChange(create,
            ancestorParent.parentType, ancestorParent.parent, descendantType, descendant,
            [ancestorParent.property, ancestorPrefix, ...intermediate])
        })
      }

      /// reacting to index that are generated from childByParent index, because it will be updated later.
      await parentByChildIndex.onChange(async (entry, oldEntry) => {
        const anyEntry = entry || oldEntry
        await propagateChange(!!entry, entry.parentType, entry.parent, entry.childType, entry.child, [anyEntry.property])
      })
    },
    parameters: {
      childByParentIndexName: definition.name + '_childByParent',
      parentByChildIndexName: definition.name + '_parentByChild'
    }
  })

  definition.index({
    name: 'expandedRoles',
    async function(input, output, { accessIndexName, publicAccessTableName, pathsIndexName }) {
      const bucketSize = 128

      async function iterate(source, prefix, cb) {
        let position = prefix + ':'
        while(true) {
          const bucket = await source.get({
            gt: position,
            lte: prefix + '_\xFF\xFF\xFF\xFF',
            limit: bucketSize
          })
          for(const entry of bucket) await cb(entry)
          if(bucket.length < bucketSize) break
          position = bucket[bucket.length - 1].id
        }
      }

      const accessIndex = await input.index(accessIndexName)
      const publicAccessTable = input.table(publicAccessTableName)
      const pathsIndex = await input.index(pathsIndexName)

      function updateRoles(descendantType, descendant, sessionOrUserType, sessionOrUser, pathId,
                           rolesAdded, rolesRemoved,
                           pathIdHash = sha1(pathId, 'base64')) {
        const prefix = [descendantType, descendant, sessionOrUserType, sessionOrUser]
          .map(v => JSON.stringify(v)).join(':')
        const promises = []
        for(const role of rolesAdded) {
          promises.push(output.put({
            id: prefix + ':' + JSON.stringify(role) + '_' + pathIdHash,
            objectType: descendantType,
            object: descendant,
            sessionOrUserType,
            sessionOrUser,
            role,
            path: pathId
          }))
        }
        for(const role of rolesRemoved) {
          promises.push(output.delete({
            id: prefix + ':' + JSON.stringify(role) + '_' + pathIdHash
          }))
        }
        return Promise.all(promises)
      }

      function rolesDiff(roles, oldRoles) {
        if(!roles) roles = []
        if(!oldRoles) oldRoles = []
        const rolesAdded = roles.filter(r => !oldRoles.includes(r))
        const rolesRemoved = oldRoles.filter(r => !roles.includes(r))
        return [ rolesAdded, rolesRemoved ]
      }

      async function handleAccessChanged(objectType, object, sessionOrUserType, sessionOrUser,
                                         rolesAdded, rolesRemoved) {
        /// Find object descendants
        const pathsPrefix = [objectType, object].map(v => JSON.stringify(v)).join(':')
        await iterate(pathsIndex, pathsPrefix, async path => {
          const promises = []
          const { descendantType, descendant, id: pathId } = path
          const pathIdHash = sha1(pathId, 'base64')
          await updateRoles(descendantType, descendant, sessionOrUserType, sessionOrUser, pathId,
            rolesAdded, rolesRemoved, pathIdHash)
        })
      }

      async function handlePathChanged(path, oldPath) {
        const existingPath = path || oldPath
        const { ancestorType, ancestor, descendantType, descendant, id: pathId } = existingPath
        const pathIdHash = sha1(pathId, 'base64')
        const prefix = [ancestorType, ancestor].map(v => JSON.stringify(v)).join(':')
        const publicAccess = await publicAccessTable.objectGet(prefix)
        await Promise.all([
          updateRoles(descendantType, descendant, 'publicSession', '', pathId,
            path && publicAccess?.sessionRoles || [],
            !path && publicAccess?.sessionRoles || [],
            pathIdHash),
          updateRoles(descendantType, descendant, 'publicUser', '', pathId,
            path && publicAccess?.userRoles || [],
            !path && publicAccess?.userRoles || [],
            pathIdHash),
        ])
        await iterate(accessIndex, prefix, async access => {
          const { sessionOrUserType, sessionOrUser, roles } = access
          await updateRoles(descendantType, descendant, sessionOrUserType, sessionOrUser, pathId,
            path ? roles : [], path ? [] : roles, pathIdHash)
        })
      }

      await accessIndex.onChange(async (access, oldAccess) => {
        const existingAccess = access || oldAccess
        const { objectType, object, sessionOrUserType, sessionOrUser } = existingAccess
        const [ rolesAdded, rolesRemoved ] = rolesDiff(access?.roles, oldAccess?.roles)
        await updateRoles(objectType, object, sessionOrUserType, sessionOrUser, null,
          rolesAdded, rolesRemoved, 'self')
        await handleAccessChanged(objectType, object, sessionOrUserType, sessionOrUser, rolesAdded, rolesRemoved)
      })

      await publicAccessTable.onChange(async (publicAccess, oldPublicAccess) => {
        const existingPublicAccess = publicAccess || oldPublicAccess
        const { objectType, object } = existingPublicAccess
        const [sessionRolesAdded, sessionRolesRemoved] = rolesDiff(
          publicAccess?.sessionRoles, oldPublicAccess?.sessionRoles
        )
        const [userRolesAdded, userRolesRemoved] = rolesDiff(
          publicAccess?.userRoles, oldPublicAccess?.userRoles
        )
        await Promise.all([
          updateRoles(objectType, object, 'publicSession', '', null,
            sessionRolesAdded, sessionRolesRemoved, 'self'),
          updateRoles(objectType, object, 'publicUser', '', null,
            userRolesAdded, userRolesRemoved, 'self')
        ])
        await handleAccessChanged(objectType, object, 'publicSession', '',
          sessionRolesAdded, sessionRolesRemoved)
        await handleAccessChanged(objectType, object, 'publicUser', '',
          userRolesAdded, userRolesRemoved)
      })

      //await pathsIndex.onChange(handlePathChanged)
    },
    parameters: {
      accessIndexName: definition.name + '_Access_byObjectExtended',
      publicAccessTableName: definition.name + '_PublicAccess',
      pathsIndexName: definition.name + '_pathsByAncestorDescendantRelation'
    }
  })

  const roleByOwnerAndObjectIndex = definition.index({
    name: 'roleByOwnerAndObject',
    async function(input, output, { expandedRolesIndexName }) {
      const expandedRolesIndex = await input.index(expandedRolesIndexName)
      await expandedRolesIndex.onChange(async (expandedRole, oldExpandedRole) => {
        const existingExpandedRole = expandedRole || oldExpandedRole
        const { sessionOrUserType, sessionOrUser, role, objectType, object } = existingExpandedRole
        const sourcePrefix = existingExpandedRole.id.slice(0, existingExpandedRole.id.lastIndexOf('_'))
        // counting needed only when delete detected!
        const count = (expandedRole && 1) || (await expandedRolesIndex.count({
          gte: sourcePrefix + ':',
          lte: sourcePrefix + '_\xFF\xFF\xFF\xFF',
          limit: 1
        }))
        if(count) {
          await output.put({
            id: [sessionOrUserType, sessionOrUser, objectType, object, role]
              .map(v => JSON.stringify(v)).join(':'),
            sessionOrUserType, sessionOrUser, role, objectType, object
          })
        } else {
          await output.delete({
            id: [sessionOrUserType, sessionOrUser, objectType, object, role]
              .map(v => JSON.stringify(v)).join(':')
          })
        }
      })
    },
    parameters: {
      expandedRolesIndexName: definition.name + '_expandedRoles'
    }
  })
  const objectByOwnerAndRoleIndex = definition.index({
    name: 'objectByOwnerAndRole',
    async function(input, output, { rolesIndexName }) {
      const rolesIndex = await input.index(rolesIndexName)
      const mapper = (source) => {
        if(!source) return null
        const { sessionOrUserType, sessionOrUser, role, objectType, object } = source
        return {
          id: [sessionOrUserType, sessionOrUser, role, objectType, object]
            .map(v => JSON.stringify(v)).join(':'),
          sessionOrUserType, sessionOrUser, role, objectType, object
        }
      }
      await rolesIndex.onChange(async (role, oldRole) => {
        await output.change(mapper(role), mapper(oldRole))
      })
    },
    parameters: {
      rolesIndexName: definition.name + '_roleByOwnerAndObject'
    }
  })

  const ownerByObjectAndRoleIndex = definition.index({
    name: 'ownerByObjectAndRole',
    async function(input, output, { rolesIndexName }) {
      const rolesIndex = await input.index(rolesIndexName)
      const mapper = (source) => {
        if(!source) return null
        const { sessionOrUserType, sessionOrUser, role, objectType, object } = source
        return {
          id: [objectType, object, role, sessionOrUserType, sessionOrUser]
            .map(v => JSON.stringify(v)).join(':'),
          sessionOrUserType, sessionOrUser, role, objectType, object
        }
      }
      await rolesIndex.onChange(async (role, oldRole) => {
        await output.change(mapper(role), mapper(oldRole))
      })
    },
    parameters: {
      rolesIndexName: definition.name + '_roleByOwnerAndObject'
    }
  })

  definition.view({
    name: 'accessibleObjects',
    properties: {
      sessionOrUserType: {
        type: String,
        validation: ['nonEmpty']
      },
      sessionOrUser: {
        type: String,
        validation: ['nonEmpty']
      },
      objectType: {
        type: String
      },
      ...App.rangeProperties
    },
    access({ }, { client }) {
      return client.roles.includes('admin')
    },
    daoPath(params, { client, service }, method) {
      const { sessionOrUserType, sessionOrUser, objectType } = params
      const range = App.extractRange(params)
      if(!range.limit || range.limit > 1000) range.limit = 1000
      if(objectType) {
        return roleByOwnerAndObjectIndex.rangePath(
          [sessionOrUserType, sessionOrUser, objectType],
          range
        )
      } else {
        return ownerByObjectAndRoleIndex.rangePath(
          [sessionOrUserType, sessionOrUser],
          range
        )
      }
    }
  })

  definition.view({
    name: 'accessibleObjectsCount',
    properties: {
      sessionOrUserType: {
        type: String,
        validation: ['nonEmpty']
      },
      sessionOrUser: {
        type: String,
        validation: ['nonEmpty']
      },
      objectType: {
        type: String
      },
      ...App.rangeProperties
    },
    access({ }, { client }) {
      return client.roles.includes('admin')
    },
    daoPath(params, { client, service }, method) {
      const { sessionOrUserType, sessionOrUser, objectType } = params
      const range = App.extractRange(params)
      if(!range.limit || range.limit > 1000) range.limit = 1000
      if(objectType) {
        return roleByOwnerAndObjectIndex.countPath(
          [sessionOrUserType, sessionOrUser, objectType],
          range
        )
      } else {
        return ownerByObjectAndRoleIndex.countPath(
          [sessionOrUserType, sessionOrUser],
          range
        )
      }
    }
  })

  definition.view({
    name: 'myAccessibleObjects',
    properties: {
      objectType: {
        type: String
      },
      ...App.rangeProperties
    },
    access({ }, { client }) {
      return client.roles.includes('admin')
    },
    daoPath(params, { client, service }, method) {
      const [ sessionOrUserType, sessionOrUser ] = client.user 
        ? ['user_User', client.user] : ['session_Session', client.session]
      const { objectType } = params
      const range = App.extractRange(params)
      if(!range.limit || range.limit > 1000) range.limit = 1000
      if(objectType) {
        return roleByOwnerAndObjectIndex.rangePath(
          [sessionOrUserType, sessionOrUser, objectType],
          range
        )
      } else {
        return ownerByObjectAndRoleIndex.rangePath(
          [sessionOrUserType, sessionOrUser],
          range
        )
      }
    }
  })

  definition.view({
    name: 'myAccessibleObjectsCount',
    properties: {
      objectType: {
        type: String
      },
      ...App.rangeProperties
    },
    access({ }, { client }) {
      return client.roles.includes('admin')
    },
    daoPath(params, { client, service }, method) {
      const [ sessionOrUserType, sessionOrUser ] = client.user 
        ? ['user_User', client.user] : ['session_Session', client.session]
      const { objectType } = params
      const range = App.extractRange(params)
      if(!range.limit || range.limit > 1000) range.limit = 1000
      if(objectType) {
        return roleByOwnerAndObjectIndex.countPath(
          [sessionOrUserType, sessionOrUser, objectType],
          range
        ) 
      } else {
        return ownerByObjectAndRoleIndex.countPath(
          [sessionOrUserType, sessionOrUser],
          range
        )
      }
    }
  })


  definition.view({
    name: 'accessibleObjectsByRole',
    properties: {
      sessionOrUserType: {
        type: String,
        validation: ['nonEmpty']
      },
      sessionOrUser: {
        type: String,
        validation: ['nonEmpty']
      },
      role: {
        type: String,
        validation: ['nonEmpty']
      },
      objectType: {
        type: String
      },
      ...App.rangeProperties
    },
    access({ }, { client }) {
      return client.roles.includes('admin')
    },
    daoPath(params, { client, service }, method) {
      const { sessionOrUserType, sessionOrUser, role, objectType } = params
      const range = App.extractRange(params)
      if(!range.limit || range.limit > 1000) range.limit = 1000
      if(objectType) {
        return objectByOwnerAndRoleIndex.rangePath(
          [sessionOrUserType, sessionOrUser, role, objectType],
          range
        )
      } else {
        return ownerByObjectAndRoleIndex.rangePath(
          [sessionOrUserType, sessionOrUser, role],
          range
        )
      }
    }
  })

  definition.view({
    name: 'accessibleObjectsByRoleCount',
    properties: {
      sessionOrUserType: {
        type: String,
        validation: ['nonEmpty']    
      },
      sessionOrUser: {
        type: String,
        validation: ['nonEmpty']
      },
      role: {
        type: String,
        validation: ['nonEmpty']
      },
      objectType: {
        type: String
      },
      ...App.rangeProperties
    },  
    access({ }, { client }) {
      return client.roles.includes('admin')
    },
    daoPath(params, { client, service }, method) {
      const { sessionOrUserType, sessionOrUser, role, objectType } = params
      const range = App.extractRange(params)
      if(!range.limit || range.limit > 1000) range.limit = 1000
      if(objectType) {
        return objectByOwnerAndRoleIndex.countPath(
          [sessionOrUserType, sessionOrUser, role, objectType],
          range
        )
      } else {
        return ownerByObjectAndRoleIndex.countPath(
          [sessionOrUserType, sessionOrUser, role],
          range
        )
      }
    }
  })

  definition.view({
    name: 'myAccessibleObjectsByRole',
    properties: {
      role: {
        type: String,
        validation: ['nonEmpty']
      },
      objectType: {
        type: String
      },
      ...App.rangeProperties
    },
    access({ }, { client }) {
      return client.roles.includes('admin') 
    },
    daoPath(params, { client, service }, method) {
      const [ sessionOrUserType, sessionOrUser ] = client.user 
        ? ['user_User', client.user] : ['session_Session', client.session]
      const { role, objectType } = params
      const range = App.extractRange(params)  
      if(!range.limit || range.limit > 1000) range.limit = 1000
      if(objectType) {
        return objectByOwnerAndRoleIndex.rangePath(
          [sessionOrUserType, sessionOrUser, role, objectType],
          range
        )
      } else {
        return ownerByObjectAndRoleIndex.rangePath(
          [sessionOrUserType, sessionOrUser, role],
          range
        )
      }
    }
  })

  definition.view({
    name: 'myAccessibleObjectsByRoleCount',
    properties: {
      role: {
        type: String,
        validation: ['nonEmpty']
      },
      objectType: {
        type: String
      },
      ...App.rangeProperties
    },
    access({ }, { client }) {
      return client.roles.includes('admin')
    },
    daoPath(params, { client, service }, method) {
      const [ sessionOrUserType, sessionOrUser ] = client.user 
        ? ['user_User', client.user] : ['session_Session', client.session]
      const { role, objectType } = params
      const range = App.extractRange(params)
      if(!range.limit || range.limit > 1000) range.limit = 1000
      if(objectType) {
        return objectByOwnerAndRoleIndex.countPath(
          [sessionOrUserType, sessionOrUser, role, objectType],
          range
        )
      } else {
        return ownerByObjectAndRoleIndex.countPath(
          [sessionOrUserType, sessionOrUser, role],
          range
        )
      }
    }
  })

  function isObjectRole(client, objectType, object, role) {
    const [ sessionOrUserType, sessionOrUser ] = client.user 
      ? [ 'user_User', client.user ] : [ 'session_Session', client.session ]
    const found = objectByOwnerAndRoleIndex.rangePath(
      [sessionOrUserType, sessionOrUser, role, objectType, object],
      { limit: 1 }
    )
    return found.length > 0
  }

  definition.view({
    name: 'objectAccesses',
    properties: {
      objectType: {
        type: String,
        validation: ['nonEmpty']
      },
      object: {
        type: String,
        validation: ['nonEmpty']
      },
      role: {
        type: String,    
      },
      ...App.rangeProperties
    },
    access({ objectType, object }, { client }) {
      if(client.roles.includes('admin')) return true
      return isObjectRole(client, objectType, object, 'owner')
    },
    daoPath(params, { client, service }, method) {
      const { objectType, object } = params
      const range = App.extractRange(params)
      if(!range.limit || range.limit > 1000) range.limit = 1000
      if(role) {
        return objectByOwnerAndRoleIndex.rangePath(
          [objectType, object, role],
          range
        )
      } else {
        return ownerByObjectAndRoleIndex.rangePath(
          [objectType, object],
          range
        )
      }
    }
  })

  definition.view({
    name: 'objectAccessesCount',
    properties: {
      objectType: {
        type: String,
        validation: ['nonEmpty']
      },
      object: {
        type: String,
        validation: ['nonEmpty']
      },
      ...App.rangeProperties
    },  
    access({ }, { client }) {
      if(client.roles.includes('admin')) return true
      return isObjectRole(client, objectType, object, 'owner')
    },
    daoPath(params, { client, service }, method) {
      const { objectType, object } = params
      const range = App.extractRange(params)  
      if(role) {
        return objectByOwnerAndRoleIndex.countPath(
          [objectType, object, role],
          range
        )
      } else {
        return ownerByObjectAndRoleIndex.countPath(
          [objectType, object],
          range
        )
      }
    }
  })
  
}
