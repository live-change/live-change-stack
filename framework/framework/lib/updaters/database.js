import * as utils from "../utils.js"
import Debug from 'debug'
const debug = Debug('framework:updaters:db')
import { startupLog, formatMs } from "../utils/startupLog.js"

const cartesian =
  (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

const updaterRequestSettings = {
  requestTimeout: 24 * 60 * 60 * 1000 // 24 hours
}

function dbEnsureSlot(app) {
  if (!app._dbEnsure) app._dbEnsure = Object.create(null)
  return app._dbEnsure
}

/** Swallow create-already-exists (and any other) errors like the old .catch(e => 'ok'). */
function ignoreExists(promise) {
  return promise.catch(() => 'ok')
}

/**
 * Memoized ensure: one Promise per key on app._dbEnsure.
 * Timing + startupLog live inside the Promise body (only on first create).
 */
function ensureOnce(app, key, run) {
  const slot = dbEnsureSlot(app)
  if (slot[key]) return slot[key]
  slot[key] = (async () => {
    const t0 = Date.now()
    startupLog('ensure', key, 'begin')
    try {
      await run()
      startupLog('ensure', key, 'done', `in ${formatMs(Date.now() - t0)}`)
    } catch (err) {
      startupLog(
        'ensure', key, 'done (ignored error)',
        `in ${formatMs(Date.now() - t0)}`,
        err?.message || err
      )
    }
  })()
  return slot[key]
}

function daoReq(app, ...args) {
  return ignoreExists(app.dao.requestWithSettings(updaterRequestSettings, ...args))
}

export function ensureServicesTable(app) {
  return ensureOnce(app, 'services', async () => {
    await daoReq(app, ['database', 'createTable'], app.databaseName, 'services')
  })
}

export function ensureQueries(app) {
  return ensureOnce(app, 'queries', async () => {
    await daoReq(app, ['database', 'createTable'], app.databaseName, 'queries')
  })
}

export function ensureCache(app) {
  if (app.noCache) return Promise.resolve()
  return ensureOnce(app, 'cache', async () => {
    const database = app.databaseName
    await daoReq(app, ['database', 'createTable'], database, 'cache')
    await daoReq(app, ['database', 'createIndex'], database, 'cache_byTimestamp', `${
      async (input, output) => {
        await input.table('cache').onChange((obj, oldObj) => {
          if(obj && !oldObj) output.change({ id: obj.expiresAt+'_'+obj.id, to: obj.id }, null)
        })
      }
    }`, {})
  })
}

export function ensureEventMeta(app) {
  if (app.shortEvents) return Promise.resolve()
  return ensureOnce(app, 'eventMeta', async () => {
    const database = app.databaseName
    await daoReq(app, ['database', 'createTable'], database, 'eventConsumers')
    await daoReq(app, ['database', 'createTable'], database, 'eventReports')
  })
}

export function ensureEvents(app, service) {
  if (app.shortEvents) return Promise.resolve()
  const serviceName = service?.name
  if (app.splitEvents) {
    if (!serviceName) throw new Error('ensureEvents: service required when splitEvents')
    return ensureOnce(app, `events:${serviceName}`, async () => {
      await ensureEventMeta(app)
      await daoReq(app, ['database', 'createLog'], app.databaseName, serviceName + '_events')
    })
  }
  return ensureOnce(app, 'events', async () => {
    await ensureEventMeta(app)
    await daoReq(app, ['database', 'createLog'], app.databaseName, 'events')
  })
}

export function ensureCommands(app, service) {
  if (app.shortCommands) return Promise.resolve()
  const serviceName = service?.name
  if (app.splitCommands) {
    if (!serviceName) throw new Error('ensureCommands: service required when splitCommands')
    return ensureOnce(app, `commands:${serviceName}`, async () => {
      await daoReq(app, ['database', 'createTable'], app.databaseName, serviceName + '_commands')
    })
  }
  return ensureOnce(app, 'commands', async () => {
    const database = app.databaseName
    await daoReq(app, ['database', 'createTable'], database, 'commands')
    await daoReq(app, ['database', 'createIndex'], database, 'commands_byTimestamp', `${
      async (input, output) => {
        await input.table('commands').onChange((obj, oldObj) => {
          if(obj && !oldObj) output.change({ id: obj.timestamp+'_'+obj.id, to: obj.id }, null)
          if(!obj && oldObj) output.change(null, { id: oldObj.timestamp+'_'+oldObj.id, to: oldObj.id })
        })
      }
    }`, {})
  })
}

export function ensureTriggerRoutes(app) {
  if (app.shortTriggers) return Promise.resolve()
  return ensureOnce(app, 'triggerRoutes', async () => {
    await daoReq(app, ['database', 'createTable'], app.databaseName, 'triggerRoutes')
  })
}

export function ensureTriggers(app, service) {
  if (app.shortTriggers) return Promise.resolve()
  const serviceName = service?.name
  if (app.splitTriggers) {
    if (!serviceName) throw new Error('ensureTriggers: service required when splitTriggers')
    return ensureOnce(app, `triggers:${serviceName}`, async () => {
      await ensureTriggerRoutes(app)
      await daoReq(app, ['database', 'createTable'], app.databaseName, serviceName + '_triggers')
    })
  }
  return ensureOnce(app, 'triggers', async () => {
    const database = app.databaseName
    await ensureTriggerRoutes(app)
    await daoReq(app, ['database', 'createTable'], database, 'triggers')
    await daoReq(app, ['database', 'createIndex'], database, 'triggers_byTimestamp', `${
      async (input, output) => {
        await input.table('triggers').onChange((obj, oldObj) => {
          if(obj && !oldObj) output.change({ id: obj.timestamp+'_'+obj.id, to: obj.id }, null)
          if(!obj && oldObj) output.change(null, { id: oldObj.timestamp+'_'+oldObj.id, to: oldObj.id })
        })
      }
    }`, {})
  })
}

async function databaseUpdater(changes, service, app, force) {

  const dao = app.dao
  const database = app.databaseName
  const updaterT0 = Date.now()
  startupLog('databaseUpdater', service.name, 'begin', `changes=${changes.length}`)

  await ensureQueries(app)
  if (!app.noCache) await ensureCache(app)
  if (!app.shortEvents) await ensureEvents(app, service)
  if (!app.shortCommands) await ensureCommands(app, service)
  if (!app.shortTriggers) await ensureTriggers(app, service)

  const generateTableName = (modelName) => {
    return service.name+"_"+modelName
  }

  const indexRequestSettings = {
    requestTimeout: 24 * 60 * 60 * 1000 // 10 minutes?
  }

  async function doCreateIndexIfNotExists(indexName, functionCode, parameters, config) {
    const t0 = Date.now()
    startupLog('databaseUpdater', service.name, 'createIndex', indexName, 'begin')
    try {
      await dao.requestWithSettings(indexRequestSettings, ['database', 'createIndex'], database, indexName,
        functionCode, parameters, config)
      startupLog('databaseUpdater', service.name, 'createIndex', indexName, 'created', `in ${formatMs(Date.now() - t0)}`)
    } catch(e) {
      if((e.message ?? e).toString().includes("already exists")) {
        const indexConfig = await dao.get(['database', 'indexConfig', database, indexName])
        const indexConfigClean = JSON.stringify({
          ...indexConfig,
          uid: undefined,
          sources: undefined
        })
        const requiredConfig = JSON.stringify({          
          code: functionCode,
          parameters          
        })
        const match = indexConfigClean === requiredConfig        
        if(!match) {
          console.log("INDEXES NOT MATCHING, DELETING AND RECREATING", indexConfigClean, requiredConfig)
          startupLog('databaseUpdater', service.name, 'createIndex', indexName, 'MISMATCH — delete+recreate')
          await dao.requestWithSettings(updaterRequestSettings, ['database', 'deleteIndex'], database, indexName)
          return await doCreateIndexIfNotExists(indexName, functionCode, parameters, config)
        } else {          
          console.log("INDEXES MATCHING, SKIPPING")
          startupLog('databaseUpdater', service.name, 'createIndex', indexName, 'exists (match)', `in ${formatMs(Date.now() - t0)}`)
          return 'ok'
        }
      }      
      startupLog('databaseUpdater', service.name, 'createIndex', indexName, 'FAILED', `after ${formatMs(Date.now() - t0)}`, e?.message || e)
      throw e
    }
  }

  async function createIndex(table, indexName, index) {
    if(table) {
      indexName = table + '_' + indexName
    } else {
      indexName = generateTableName(indexName)
    }

    debug("CREATE INDEX", indexName, index)

    if(index.function) {
      const functionCode = `(${index.function})`
      ;(globalThis.compiledFunctionsCandidates = globalThis.compiledFunctionsCandidates || {})[functionCode] = index.function
      await doCreateIndexIfNotExists(
        indexName, 
        functionCode, 
        { ...(index.parameters || {}) },
        { ...index.storage ?? {}, sourceName: index.sourceName ?? undefined }
      ) 
    } else {
      if(!table) throw new Error("only function indexes are possible without table")
      if(index.multi) {
       // if(Array.isArray(index.property)) throw new Error("multi indexes on multiple properties are not supported!")
        const properties = (Array.isArray(index.property) ? index.property : [index.property])
          .map(propSet => (Array.isArray(propSet) ? propSet : [propSet]).map(p => p.split('.')))
        const func = async function(input, output, { table, properties, hash }) {
          const value = (obj, property) => {
            let at = obj
            for(const p of property) at = at && at[p]
            if(at === undefined) return []
            if(Array.isArray(at)) return at.map(v => JSON.stringify(v))
            return [JSON.stringify(at)]
          }
          const keys = (obj, id = 0) => {
            const values = properties[id].map(property => value(obj, property)).flat()
            if(id === properties.length - 1) return values
            return values.flatMap(v => keys(obj, id + 1).map(k => v + ':' + k))
          }
          await input.table(table).onChange((obj, oldObj) => {
            if(obj && oldObj) {
              let pointers = obj && new Set(keys(obj))
              let oldPointers = oldObj && new Set(keys(oldObj))
              for(let pointer of pointers) if(!oldPointers.has(pointer)) {
                output.change({ id: pointer+'_'+(hash ? sha1(obj.id, 'base64') : obj.id), to: obj.id }, null)
              }
              for(let pointer of oldPointers) if(!pointers.has(pointer)) {
                output.change(null, { id: pointer+'_'+(hash ? sha1(obj.id, 'base64') : obj.id), to: obj.id })
              }
            } else if(obj) {
              keys(obj).forEach(k => output.change({
                id: k+'_'+(hash ? sha1(obj.id, 'base64') : obj.id),
                to: obj.id }, null))
            } else if(oldObj) {
              keys(oldObj).forEach(k => output.change(null, {
                id: k+'_'+(hash ? sha1(oldObj.id, 'base64') : oldObj.id),
                to: oldObj.id }))
            }
          })
        }
        const functionCode = `(${func})`
        ;(globalThis.compiledFunctionsCandidates = globalThis.compiledFunctionsCandidates || {})[functionCode] = func
        await doCreateIndexIfNotExists(indexName, functionCode, { properties, table, hash: index.hash }, index.storage ?? {})
      } else {
        if(!table) throw new Error("only function indexes are possible without table")
        const properties = (Array.isArray(index.property) ? index.property : [index.property]).map(p => p.split('.'))
        const func = async function(input, output, { table, properties, hash }) {
          const mapper = (obj) => ({
            id: properties.map(path => {
              let at = obj
              for(const p of path) at = at && at[p]
              return at === undefined ? '' : JSON.stringify(at)
            }).join(':')+'_'+(hash ? sha1(obj.id, 'base64') : obj.id),
            to: obj.id
          })
          await input.table(table).onChange((obj, oldObj) =>            
            output.change(obj && mapper(obj), oldObj && mapper(oldObj)) )
        }
        const functionCode = `(${func})`
        ;(globalThis.compiledFunctionsCandidates = globalThis.compiledFunctionsCandidates || {})[functionCode] = func
        await doCreateIndexIfNotExists(indexName, functionCode, { properties, table, hash: index.hash }, index.storage ?? {})
      }
    }

    debug("INDEX CREATED!", index)
  }

  debug("DATABASE UPDATER")

  for(let i = 0; i < changes.length; i++) {
    const change = changes[i]
    debug("PROCESSING CHANGE", change)
    const changeT0 = Date.now()
    const changeLabel = change.operation
      + (change.name ? `:${change.name}` : '')
      + (change.model?.name ? `@${change.model.name}` : (typeof change.model === 'string' ? `@${change.model}` : ''))
    startupLog('databaseUpdater', service.name, 'change', `${i + 1}/${changes.length}`, changeLabel, 'begin')
    switch(change.operation) {
      case "createModel": {
        const model = change.model
        const tableName = generateTableName(model.name)
        await dao.requestWithSettings(updaterRequestSettings, ['database', 'createTable'], database, tableName, model.storage ?? {})
        debug("TABLE CREATED!", tableName)
        for(const [indexName, index] of Object.entries(model.indexes || {})) {
          if(index.created) continue
          if(index.dependsOn) {
            const dependsOn = Array.isArray(index.dependsOn) ? index.dependsOn : [index.dependsOn]
            for(const indexName of dependsOn) {
              const index = model.indexes[indexName]
              await createIndex(tableName, indexName, index)
              index.created = true
            }
          }
          await createIndex(tableName, indexName, index)
          index.created = true
        }
      } break
      case "renameModel": {
        const from = generateTableName(change.from)
        const to = generateTableName(change.to)
        const model = change.model
        for(let indexName in model.indexes) {
          let indexName = change.name
          indexName = from + '_' + indexName
          await dao.requestWithSettings(updaterRequestSettings, ['database', 'deleteIndex'], database, indexName)
        }
        await dao.requestWithSettings(updaterRequestSettings, ['database', 'renameTable'], database, from, to)
        for(let indexName in model.indexes) {
          const index = model.indexes[indexName]
          await createIndex(to, indexName, index)
        }
      } break
      case "deleteModel": {
        const tableName = generateTableName(change.name)
        debug("DELETE TABLE")
        const model = change.model
        for(let indexKey in model.indexes) {
          const indexName = tableName + '_' + indexKey
          debug("DELETE INDEX", indexName, indexKey)
          try {
            await dao.requestWithSettings(updaterRequestSettings, ['database', 'deleteIndex'], database, indexName)
          } catch(e) {
            console.error(e)
          }
        }
        try {
          await dao.requestWithSettings(updaterRequestSettings, ['database', 'deleteTable'], database, tableName)
        } catch(e) {
          console.error(e)
        }
      } break
      case "createIndex": {
        const table = change.model ? generateTableName(change.model) : null
        const index = change.index
        await createIndex(table, change.name, index, change.model)
      } break
      case "renameIndex": {
        const table = change.model ? generateTableName(change.model) : null
        let from = change.from
        let to = change.to
        if(table) {
          from = table + '_' + from
          to = table + '_' + to
        } else {
          from = generateTableName(from)
          to = generateTableName(to)
        }
        await dao.requestWithSettings(updaterRequestSettings, ['database', 'renameIndex'], database, from, to)
      } break
      case "deleteIndex": {
        const table = change.model ? generateTableName(change.model) : null
        let indexName = change.name
        if(table) {
          indexName = table + '_' + indexName
        } else {
          indexName = generateTableName(indexName)
        }
        try {
          await dao.requestWithSettings(updaterRequestSettings, ['database', 'deleteIndex'], database, indexName)
        } catch(e) {
          console.error(e)
        }
      } break
      case "createProperty": {
        // reverseMerge = fill missing only; existing row values (incl. arrays) win over defaults
        const table = generateTableName(change.model)
        const property = change.property
        const defaultValue = property.defaultValue ?? property.default
        if(defaultValue === undefined || typeof defaultValue === 'function') {
          debug("CREATE PROPERTY SKIP SCAN (no concrete default)", change.name)
          break
        }
        let update = {}
        update[change.name] = defaultValue
        debug("CREATE PROPERTY UPDATE", update)
        await dao.requestWithSettings(updaterRequestSettings, ['database', 'query'], database, `(${
            async (input, output, { table, update }) =>
              await input.table(table).onChange((obj, oldObj) => {
                if(obj) output.table(table).update(obj.id, [{ op: 'reverseMerge', value: update }])
              })
        })`, { table, update })
      } break;
      case "renameProperty": {
        const table = generateTableName(change.model)
        await dao.requestWithSettings(updaterRequestSettings, ['database', 'query'], database, `(${
            async (input, output, { table, from, to }) => {
              const path = from.slice('.')
              await input.table(table).onChange((obj, oldObj) => {
                if(obj) {
                  let value = obj
                  for(let p of path) value = value && value[p]
                  output.table(table).update(obj.id, [
                    { op: 'set', property: to, value },
                    { op: 'delete', property: from }
                  ])
                }
              })
            }
        })`, { table, from: change.from, to: change.to })
      } break;
      case "deleteProperty": {
        const table = generateTableName(change.model)
        /*await dao.requestWithSettings(updaterRequestSettings, ['database', 'query'], database, `(${
            async (input, output, { table, property }) => {
              await input.log(table).onChange((obj, oldObj) => {
                if(obj) {
                  output.table(table).update(obj.id, [
                    { op: 'delete', property }
                  ])
                }
              })
            }
        })`, { table, property: change.name })*/
      } break;
      case "createQuery": {
        const query = change.query
        const queryKey = service.name + '.' + query.name
        await dao.requestWithSettings(updaterRequestSettings, ['database', 'put'], database, 'queries', {
          id: queryKey,
          code: `(${query.code.toString()})`,
          sourceName: query.sourceName,
          update: query.update,
          timeout: query.timeout,          
          properties: query.properties,
          returns: query.returns,
          ...query.config                  
        })
        debug("QUERY CREATED!", query.name)
      } break;
      case "renameQuery": {        
        const query = change.to        
        const queryKey = service.name + '.' + query.name
        const oldQueryKey = service.name + '.' + change.from.name
        const oldQuery = await dao.get(['database', 'get', database, 'queries', oldQueryKey])
        await dao.requestWithSettings(updaterRequestSettings, ['database', 'put'], database, 'queries', {
          id: queryKey,
          code: `(${oldQuery.code.toString()})`,
          sourceName: oldQuery.sourceName,
          update: oldQuery.update, 
          timeout: oldQuery.timeout,          
          properties: oldQuery.properties,
          returns: oldQuery.returns                    
        })        
        await dao.requestWithSettings(updaterRequestSettings, ['database', 'delete'], database, 'queries', oldQueryKey)
        debug("QUERY RENAMED!", query.name)
      } break;
      case "deleteQuery": {
        const queryKey = service.name + '.' + change.name
        await dao.requestWithSettings(updaterRequestSettings, ['database', 'delete'], database, 'queries', queryKey)
        debug("QUERY DELETED!", change.name)
      } break;
      default:
    }
    startupLog('databaseUpdater', service.name, 'change', `${i + 1}/${changes.length}`, changeLabel, 'done', `in ${formatMs(Date.now() - changeT0)}`)
  }
  debug("DATABASE UPDATED")

  debug("CHECKING DATABASE INTEGRITY...")
  const integrityT0 = Date.now()
  startupLog('databaseUpdater', service.name, 'integrityCheck begin')
  const indexes = await dao.get(['database', 'indexesList', database])
  for(const modelName in service.models) {
    const tableName = generateTableName(modelName)
    const model = service.models[modelName]
    for(const indexName in model.indexes) {
      const fullIndexName = tableName + '_' + indexName
      if(!indexes.includes(fullIndexName)) {
        debug("table ", modelName, " index", fullIndexName, "not found! creating...")
        startupLog('databaseUpdater', service.name, 'integrity: missing index', fullIndexName)
        await createIndex(generateTableName(modelName), indexName, model.indexes[indexName])
      }
    }
  }
  for(const indexName in service.indexes) {
    const fullIndexName = generateTableName(indexName)
    if(!indexes.includes(fullIndexName)) {
      debug("index", fullIndexName, "not found! creating...")
      startupLog('databaseUpdater', service.name, 'integrity: missing index', fullIndexName)
      await createIndex(null, indexName, service.indexes[indexName])
    }
  }
  startupLog('databaseUpdater', service.name, 'integrityCheck done', `in ${formatMs(Date.now() - integrityT0)}`)
  startupLog('databaseUpdater', service.name, 'total', formatMs(Date.now() - updaterT0))
}

export default databaseUpdater

