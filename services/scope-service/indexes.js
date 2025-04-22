import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config

import { Scope } from './scopes.js'

//*
export const pathByObjectAndScopeIndex = definition.index({ 
  name: 'pathByObjectAndScope',  /// there can be multiple paths for the same scope -> object pairs
  async function(input, output, { scopesTableName, pathsByAncestorDescendantRelationIndexName }) {
    /// Can be optimized by using a ScopeIndexer for indexing scope using range changes    
    const scopesTable = await input.table(scopesTableName)
    const pathsIndex = await input.index(pathsByAncestorDescendantRelationIndexName)
    
    const crossed = scopesTable.cross(pathsIndex, scope => ({ /// scope to path range by ancestorType
      gte: `"${scope.id}":`,
      lte: `"${scope.id}"_\xFF\xFF\xFF\xFF`
    }), path => path.ancestorType, 128)

    const results = crossed.map(async ([scope, path]) => {
      //output.debug('scope', scope, 'path', path)
      if(!(scope && path)) return null
      const { ancestorType, ancestor, descendantType, descendant, intermediate } = path
      const identifier = [descendantType, descendant, ancestorType, ancestor].map(v => JSON.stringify(v)).join(':')
      const hash = sha256(identifier + JSON.stringify(intermediate), 'base64').slice(0, 10)
      const id = identifier + '_' + hash
      return {
        id,
        scopeType: ancestorType,
        scope: ancestor,
        objectType: descendantType,
        object: descendant,
        intermediate
      }
    })

    await results.to(output)
  },
  parameters: {
    scopesTableName: 'scope_Scope',
    pathsByAncestorDescendantRelationIndexName: 'accessControl_pathsByAncestorDescendantRelation'
  }
})

//*
export const pathByScopeAndObjectIndex = definition.index({
  name: 'pathByScopeAndObject',
  async function(input, output, { pathByObjectAndScopeIndexName }) {
    await (await input.index(pathByObjectAndScopeIndexName))
      .map(async ({ id, scopeType, scope, objectType, object, intermediate }) => {
        const identifier = [scopeType, scope, objectType, object].map(v => JSON.stringify(v)).join(':')
        const hash = id.slice(id.lastIndexOf('_')+1)
        return { // when single parameter, it will ignore null by default
          id: identifier + '_' + hash,
          objectType,
          object,
          scopeType,
          scope,        
          intermediate: intermediate.toReversed()
        }
      })
      .to(output)
  },
  parameters: {
    pathByObjectAndScopeIndexName: 'scope_pathByObjectAndScope'
  }
})

//*
export const scopeByObjectIndex = definition.index({
  name: 'scopeByObject',
  async function(input, output, { pathByObjectAndScopeIndexName }) {
    await (await input.index(pathByObjectAndScopeIndexName))
      .groupExisting(async ({ id }) => id.slice(0, id.lastIndexOf('_')+1))
      .map(({ id, objectType, object, scopeType, scope }) => ({
        id: id.slice(0, id.lastIndexOf('_')),
        objectType, object, scopeType, scope
      }))
      .to(output)
  },
  parameters: {
    pathByObjectAndScopeIndexName: 'scope_pathByObjectAndScope'
  }
})
//*/

//*
export const objectByScopeIndex = definition.index({
  name: 'objectByScope',
  async function(input, output, { scopeByObjectIndexName }) {
    await (await input.index(scopeByObjectIndexName))
      .map(({ id, objectType, object, scopeType, scope }) => ({
        id:  [scopeType, scope, objectType, object].map(v => JSON.stringify(v)).join(':'),
        scopeType, scope, objectType, object
      }))
      .to(output)
  },
  parameters: {
    scopeByObjectIndexName: 'scope_scopeByObject'
  }
})

//*/

definition.view({
  name: 'objectScopePaths',
  properties: {
    objectType: {
      type: 'type'
    },
    object: {
      type: 'any'
    },
    scopeType: {
      type: 'type'
    },
    scope: {
      type: 'any'
    },
    ...App.rangeProperties
  },
  accessControl: {
    roles: config.objectScopePathRoles
  },
  daoPath(params, { client, service }, method) {
    const { objectType, object, scopeType, scope } = params    
    const range = App.extractRange(params)
    if(!range.limit || range.limit > 1000) range.limit = 1000
    const allParams = [objectType, object, scopeType, scope]    
    return pathByObjectAndScopeIndex.rangePath(
      allParams.slice(0, allParams.findIndex(p => p === undefined)),
      range
    )
  }
})

definition.view({
  name: 'objectScopes',
  properties: {
    objectType: {
      type: 'type'
    },
    object: {
      type: 'any'
    },
    scopeType: {
      type: 'type'
    },
    ...App.rangeProperties
  },
  accessControl: {
    roles: config.objectScopeRoles
  },
  daoPath(params, { client, service }, method) {
    const { objectType, object, scopeType } = params
    const range = App.extractRange(params)
    if(!range.limit || range.limit > 1000) range.limit = 1000
    const allParams = [objectType, object, scopeType]    
    const path = scopeByObjectIndex.rangePath(
      allParams.slice(0, allParams.findIndex(p => p === undefined)),
      range
    )
    return path
  }
})

definition.view({
  name: 'scopeObjects',
  properties: {
    scopeType: {
      type: 'type'
    },
    scope: {
      type: 'any'
    },
    objectType: {
      type: 'type'
    },
    ...App.rangeProperties
  },
  accessControl: {
    roles: config.scopeObjectRoles,
    objects: ({ scopeType, scope }) => {
      return [{ objectType: scopeType, object: scope }]
    }
  },
  daoPath(params, { client, service }, method) {
    const { scopeType, scope, objectType } = params    
    const range = App.extractRange(params)
    if(!range.limit || range.limit > 1000) range.limit = 1000
    const allParams = [scopeType, scope, objectType]
    const path = ['database', 'query', service.databaseName, `(${
      async (input, output, { indexName, scopeType, scope, objectType }) => {
        const index = await input.index(indexName)
        const prefixParts = objectType ? [scopeType, scope, objectType] : [scopeType, scope]        
        const prefix = prefixParts.map(v => JSON.stringify(v)).join(':')
        const range = {
          gte: prefix + ':',
          lte: prefix + '_\xFF\xFF\xFF\xFF'
        }
        output.debug('range', range)
        await index
          .range(range)
          .map(async (indexObj, id, timestamp) => {
            if(!indexObj) return null
            const anyIndexObj = indexObj
            const tableName = anyIndexObj.objectType
            const table = input.table(tableName)
            const result = await table.objectGet(anyIndexObj.object)
            return {          
              ...result,
              to: result.id,
              id: anyIndexObj.id,
              //from: anyIndexObj
            }
          })
          .to(output)
      }
    })`, { indexName: 'scope_objectByScope', scopeType, scope, objectType }]
    /* const path = objectByScopeIndex.rangePath(
      allParams.slice(0, allParams.findIndex(p => p === undefined)),
      range
    ) */
    console.log('path', path)
    return path
  }
})
