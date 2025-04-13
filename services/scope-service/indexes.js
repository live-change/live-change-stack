import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config

import { Scope } from './scopes.js'

//*
const scopesByObjectIndex = definition.index({
  name: 'scopesByObject',  
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
      return {
        id: [descendantType, descendant, ancestorType, ancestor].map(v => JSON.stringify(v)).join(':'),
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
const objectsByScopeIndex = definition.index({
  name: 'objectsByScope',
  async function(input, output, { scopesByObjectIndexName }) {
    (await input.index(scopesByObjectIndexName))
      .map(async ({ scopeType, scope, objectType, object, intermediate }) => ({ // when single parameter, it will ignore null by default
        id: [scopeType, scope, objectType, object].map(v => JSON.stringify(v)).join(':'),
        objectType,
        object,
        scopeType,
        scope,
        intermediate: intermediate.toReversed()
      }))
      .to(output)
  },
  parameters: {
    scopesByObjectIndexName: 'scope_scopesByObject'
  }
})
//*/