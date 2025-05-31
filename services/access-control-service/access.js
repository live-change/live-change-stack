import { parents, parentsSources } from './accessControlParents.js'
import App from '@live-change/framework'
const app = App.app()

export default (definition) => {

  const Access = definition.foreignModel('accessControl', 'Access')
  const PublicAccess = definition.foreignModel('accessControl', 'PublicAccess')

  const config = definition?.config?.access ?? {}

  const { /// TODO: per type access config
    hasAny = (roles, client, { objectType, object }) => roles.length > 0,
    isAdmin = (roles, client, { objectType, object }) => roles.includes('admin'),
    canInvite = (roles, client, { objectType, object }) => roles.length > 0,
    canRequest = (roles, client, { objectType, object }) => false
  } = config

  function testRoles(requiredRoles, clientRoles) {
    if(!requiredRoles || requiredRoles.length === 0) return true
    for(const requiredRolesOption of requiredRoles) {
      if(
        (Array.isArray(requiredRolesOption) ? requiredRolesOption : [requiredRolesOption])
          .every(role => clientRoles.includes(role))
      ) return true
    }
    return false
  }

  async function clientHasAnyAccess(client, { objectType, object, objects }) {
    return checkRoles(client, { objectType, object, objects }, hasAny)
  }

  function clientHasAdminAccess(client, { objectType, object, objects }) {
    return checkRoles(client, { objectType, object, objects }, isAdmin)
  }

  function clientCanInvite(client, { objectType, object, objects }) {
    return checkRoles(client, { objectType, object, objects }, canInvite, true)
  }

  function clientCanRequest(client, { objectType, object, objects }) {
    return checkRoles(client, { objectType, object, objects }, canRequest)
  }

  function clientHasAccessRole(client, { objectType, object, objects }, role) {
    return checkRoles(client, { objectType, object, objects }, (roles) => roles.includes(role) )
  }

  function clientHasAccessRoles(client, { objectType, object, objects }, roles) {
    return checkRoles(client, { objectType, object, objects },
      (clientRoles) => testRoles(roles, clientRoles)
    )
  }

  async function getUnitClientRoles(client, { objectType, object }, ignorePublic) {
    const [
      publicAccessData,
      sessionAccess,
      userAccess,
    ] = await Promise.all([
      ignorePublic ? null : PublicAccess.get(App.encodeIdentifier([ objectType, object ])),
      Access.get(App.encodeIdentifier([ 'session_Session', client.session, objectType, object ])),
      client.user
        ? Access.get(App.encodeIdentifier([ 'user_User', client.user, objectType, object ]))
        : Promise.resolve(null)
    ])
    let roles = []
    if(publicAccessData) {
      roles.push(...(publicAccessData.sessionRoles ?? []))
      if(client.user) roles.push(...(publicAccessData.userRoles ?? []))
    }
    if(sessionAccess) roles.push(...sessionAccess.roles)
    if(userAccess) roles.push(...userAccess.roles)
    if(objectType === 'user_User' && object === client.user) roles.push('owner')
    if(objectType === 'session_Session' && object === client.session) roles.push('owner')
    //console.log("GOT UNIT CLIENT:", client, "ROLES:", roles, "IGNORE PUBLIC:", ignorePublic)
    return Array.from(new Set(roles))
  }

  async function getClientObjectRoles(client, { objectType, object }, ignorePublic) {
    const unitRolesPromise = getUnitClientRoles(client, { objectType, object}, ignorePublic)
    const accessParentsPromise = parents[objectType]
      ? parents[objectType]({ objectType, object })
      : Promise.resolve([])
    /*accessParentsPromise.then((foundParents) => {
      console.log('ACCESS CONTROL PARENTS', foundParents, "FOR", objectType, '/' ,object, 'IN MAP', parents)
    })*/
    const parentRolesPromise = accessParentsPromise.then(accessParents => Promise.all(
        accessParents.map(
          ({ objectType, object }) =>
            getClientObjectRoles(client, { objectType, object }, ignorePublic)
        )
      ).then(rolesArrays => rolesArrays.flat()))
    const [ unitRoles, parentRoles ] = await Promise.all([ unitRolesPromise, parentRolesPromise ])
    return Array.from(new Set([ ...client.roles, ...unitRoles, ...parentRoles]))
  }

  async function getClientObjectsRoles(client, objects, ignorePublic) {
    const objectsRoles = await Promise.all(
      objects.map(obj => getClientObjectRoles(client, obj, ignorePublic))
    )
    const firstObjectRoles = objectsRoles.shift()
    let roles = firstObjectRoles
    for(const objectRoles of objectsRoles) {
      roles = roles.filter(role => objectRoles.includes(role))
    }
    return roles
  }



  /// QUERIES:

  function dbAccessFunctions({
      input, publicAccessTable, accessTable, updateRoles, isLoaded,
      client, parentsSourcesMap, output
    }) {
    async function treeNode(objectType, object) {
      if(!objectType) throw new Error('No objectType for accessControl treeNode')
      if(!object) throw new Error('No object for accessControl treeNode')
      const node = {
        objectType, object,
        data: null,
        parents: [],
        publicSessionRoles: [],
        publicUserRoles: [],
        sessionRoles: [],
        userRoles: [],
        ownerRoles: [],
      }
      let objectObserver, publicAccessObserver, sessionAccessObserver, userAccessObserver

      const publicAccessObject = publicAccessTable.object(`${JSON.stringify(objectType)}:${JSON.stringify(object)}`)
      publicAccessObserver = publicAccessObject.onChange((accessData, oldAccessData) => {
        node.publicSessionRoles = accessData?.sessionRoles ?? []
        node.publicUserRoles = (client.user && accessData?.userRoles) ?? []
        if(isLoaded()) updateRoles()
      })

      const sessionAccessObject = accessTable.object(
        `"session_Session":${JSON.stringify(client.session)}:${JSON.stringify(objectType)}:${JSON.stringify(object)}`
      )
      sessionAccessObserver = sessionAccessObject && sessionAccessObject.onChange((accessData, oldAccessData) => {
        node.sessionRoles = accessData?.roles ?? []
        if(isLoaded()) updateRoles()
      })

      const userAccessObject = client.user && accessTable.object(
        `"user_User":${JSON.stringify(client.user)}:${JSON.stringify(objectType)}:${JSON.stringify(object)}`
      )
      userAccessObserver = userAccessObject && userAccessObject.onChange((accessData, oldAccessData) => {
        node.userRoles = accessData?.roles ?? []
        if(isLoaded()) updateRoles()
      })

      if(objectType === 'user_User' && object === client.user) node.ownerRoles.push('owner')
      if(objectType === 'session_Session' && object === client.session) node.ownerRoles.push('owner')

      async function disposeParents() {
        const oldParents = node.parents
        return Promise.all(oldParents.map(parent => parent.dispose()))
      }
      const parentsSources = parentsSourcesMap[objectType]
      if(parentsSources) {
        const objectTable = input.table(objectType)
        const objectTableObject = objectTable.object(object)
        let obsv = false
        objectObserver = objectTableObject.onChange(async (objectData, oldObjectData) => {
          await disposeParents()
          node.parents = objectData ? await Promise.all(parentsSources.map(parentSource => {
            const parentType = parentSource.type || objectData[parentSource.property + 'Type']
            if(!parentType) return []
            const property = objectData[parentSource.property]                        
            const parents = (Array.isArray(property) ? property : [ property ]).filter(p => !!p)
            return parents.map(parent => treeNode(parentType, parent))
          }).flat()) : []
          obsv = true
        })
      }
      node.dispose = async function() {
        const disposePromises = []
        if(objectObserver) disposePromises.push(objectObserver.then(obs => obs.dispose()))
        if(publicAccessObserver) disposePromises.push(publicAccessObserver.then(obs => obs.dispose()))
        if(sessionAccessObserver) disposePromises.push(sessionAccessObserver.then(obs => obs.dispose()))
        if(userAccessObserver) disposePromises.push(userAccessObserver.then(obs => obs.dispose()))
        disposePromises.push(disposeParents())
        return Promise.all(disposePromises)
      }
      await Promise.all([ objectObserver, publicAccessObserver, sessionAccessObserver, userAccessObserver ])
      return node
    }
    function computeNodeRoles(node) {
      const parentsRoles = node.parents.map(parent => computeNodeRoles(parent)).flat()
      return Array.from(new Set([
        ...parentsRoles,
        ...node.publicUserRoles,
        ...node.publicSessionRoles,
        ...node.userRoles,
        ...node.sessionRoles,
        ...node.ownerRoles,
      ]))
    }
    return { treeNode, computeNodeRoles }
  }

  function accessPath(client, objects) {
    for(const obj of objects) {
      if(!obj.objectType) throw new Error('No objectType for accessControl accessPath')
      if(!obj.object) throw new Error('No object for accessControl accessPath')
    }
    return ['database', 'queryObject', app.databaseName, `(${
      async (input, output, {
        objects, parentsSourcesMap, client,
        accessTableName, publicAccessTableName, dbAccessFunctions
      }) => {
        const accessTable = input.table(accessTableName)
        const publicAccessTable = input.table(publicAccessTableName)
        let loaded = false

        const { treeNode, computeNodeRoles } =
          eval(dbAccessFunctions)({
            input, publicAccessTable, accessTable, updateRoles, isLoaded: () => loaded,
            client, parentsSourcesMap, output
          })
        
        let rolesTreesRoots = objects.map(({ object, objectType }) => treeNode(objectType, object, client))

        const outputObjectId = `${JSON.stringify(client.session)}:${JSON.stringify(client.user)}:` +
                               objects.map( obj => `${JSON.stringify(obj.objectType)}:${JSON.stringify(obj.object)}`)
                                 .join(':')
        let oldOutputObject = null
        async function updateRoles() {
          if(!loaded) return
          const roots = await Promise.all(rolesTreesRoots)
          //output.debug('accessRoots', JSON.stringify(roots, null, 2))
          const accessesRoles = roots.map(root => computeNodeRoles(root))
          //output.debug(outputObjectId, "Accesses roles:", accessesRoles)
          const firstAccessRoles = accessesRoles.shift()
          let roles = firstAccessRoles
          for(const accessRoles of accessesRoles) {
            roles = roles.filter(role => accessRoles.includes(role))
          }
          const outputObject = {
            id: outputObjectId,
            roles: Array.from(new Set([...roles, ...client.roles]))
          }
          output.change(outputObject, oldOutputObject)
          oldOutputObject = outputObject
        }
        await Promise.all(rolesTreesRoots)
        loaded = true
        await updateRoles()
      }
    })`, {
      objects, parentsSourcesMap: parentsSources, client,
      accessTableName: Access.tableName, publicAccessTableName: PublicAccess.tableName,
      dbAccessFunctions: `(${dbAccessFunctions})`
    }]
  }

  function accessesPath(client, objects) {
    for(const obj of objects) {
      if(!obj.objectType) throw new Error('No objectType for accessControl accessesPath')
      if(!obj.object) throw new Error('No object for accessControl accessesPath')
    }
    return ['database', 'query', app.databaseName, `(${
      async (input, output, {
        objects, parentsSourcesMap, client,
        accessTableName, publicAccessTableName, dbAccessFunctions
      }) => {
        const accessTable = input.table(accessTableName)
        const publicAccessTable = input.table(publicAccessTableName)
        let loaded = false

        const { treeNode, computeNodeRoles } =
          eval(dbAccessFunctions)({
            input, publicAccessTable, accessTable, updateRoles, isLoaded: () => loaded,
            client, parentsSourcesMap, output,
          })

        let rolesTreesRoots = objects.map(({ object, objectType }) => treeNode(objectType, object, client))
        const accesses = []
        async function updateRoles() {
          if(!loaded) return
          const roots = await Promise.all(rolesTreesRoots)
          for(let root of roots) {
            const outputObjectId = `${JSON.stringify(client.session)}:${JSON.stringify(client.user)}` +
              `:${JSON.stringify(root.objectType)}:${JSON.stringify(root.object)}`
            const nodeRoles = computeNodeRoles(root)
            const outputObject = {
              id: outputObjectId,
              roles: Array.from(new Set([...nodeRoles, ...client.roles]))
            }
            const existingAccessIndex = accesses.findIndex(acc => acc.id === outputObjectId)
            if(existingAccessIndex !== -1) {
              if(JSON.stringify(outputObject) !== JSON.stringify(accesses[existingAccessIndex])) {
                output.change(outputObject, accesses[existingAccessIndex])
                accesses[existingAccessIndex] = outputObject
              } /// else ignore
            } else {
              output.change(outputObject, null)
              accesses.push(outputObject)
            }
          }
        }
        await Promise.all(rolesTreesRoots)
        loaded = true
        await updateRoles()
      }
    })`, {
      objects, parentsSourcesMap: parentsSources, client,
      accessTableName: Access.tableName, publicAccessTableName: PublicAccess.tableName,
      dbAccessFunctions: `(${dbAccessFunctions})`
    }]
  }

  async function checkRoles(client, { objectType, object, objects }, callback, ignorePublic) {
    const allObjects = ((objectType && object) ? [{ objectType, object }] : []).concat(objects || [])
    //const roles = await getClientObjectsRoles(client, allObjects, ignorePublic)
    const access = await app.dao.get(accessPath(client, allObjects))
    const roles = access.roles
    //console.log('checkRoles', allObjects, roles)
    //console.trace("CHECK ROLES!")
    return await callback(roles, client, { objectType, object })
  }

  return {
    testRoles,
    clientHasAnyAccess, clientHasAdminAccess,
    clientCanInvite,
    clientCanRequest,
    clientHasAccessRole,
    clientHasAccessRoles,
    getClientObjectRoles,
    getClientObjectsRoles,
    checkRoles,
    accessPath,
    accessesPath
  }

}
