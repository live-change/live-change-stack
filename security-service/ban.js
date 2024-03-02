import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
import { getClientKeysStrings, multiKeyIndexQuery, fastMultiKeyIndexQuery } from './utils.js'
import lcp from '@live-change/pattern'

const banProperties = {
  actions: {
    type: Array,
    of: {
      type: String
    }
  },
  keys: {
    type: Array,
    of: {
      type: Object,
      properties: {
        key: {
          type: {
            String
          }
        },
        value: {
          type: {
            String
          }
        }
      }
    }
  },
  expire: {
    type: Date
  },
  type: {
    type: String,
    options: ['captcha', 'block', 'delay']
  }
}

const Ban = definition.model({
  name: "Ban",
  properties: {
    ...banProperties
  },
  indexes: {
    bans: {
      property: 'keys',
      multi: true
    },
    actionBans: {
      function: async function(input, output) {
        function prefixes(ban) {
          //output.debug("BAN", ban)
          if(!ban.keys) return []
          if(!ban.actions) return []
          const v = ban.keys.length
          const w = ban.actions.length
          let res = new Array(v * w)
          for(let i = 0; i < v; i++) {
            for(let j = 0; j < w; j++) {
              const key = ban.keys[i]
              res[i * v + j] = `${ban.actions[j]}:${key.key}:${key.value}`
            }
          }
          //output.debug("BAN ACTIONS", res)
          return res
        }
        function indexObject(prefix, obj) {
          //output.debug("BAN", obj)
          return {
            id: prefix+'_'+obj.id,
            to: obj.id,
            type: obj.type,
            expire: obj.expire,
            actions: obj.actions
          }
        }
        await input.table("security_Ban").onChange((obj, oldObj) => {
          if(obj && oldObj) {
            //output.debug("CHANGE!", obj, oldObj)
            const pointers = obj && new Set(prefixes(obj))
            const oldPointers = oldObj && new Set(prefixes(oldObj))
            for(let pointer of pointers) {
              if(!!oldPointers.has(pointer)) output.change(indexObject(pointer, obj), null)
            }
            for(let pointer of oldPointers) {
              if(!!pointers.has(pointer)) output.change(null, indexObject(pointer, oldObj))
            }
          } else if(obj) {
            //output.debug("CREATE!", obj, oldObj)
            prefixes(obj).forEach(v => output.change(indexObject(v, obj), null))
          } else if(oldObj) {
            //output.debug("DELETE!", obj, oldObj)
            prefixes(oldObj).forEach(v => output.change(null, indexObject(v, oldObj)))
          }
        })
      }
    },
    actionBansByType: {
      function: async function(input, output) {
        function prefixes(ban) {
          //output.debug("BAN", ban)
          if(!ban.keys) return []
          if(!ban.actions) return []
          const v = ban.keys.length
          const w = ban.actions.length
          let res = new Array(v * w)
          for(let i = 0; i < v; i++) {
            for(let j = 0; j < w; j++) {
              const key = ban.keys[i]
              res[i * v + j] = `${ban.actions[j]}:${key.key}:${key.value}:${ban.type}:${ban.expire}`
            }
          }
          output.debug("BAN PREFIXES", res)
          return res
        }
        function indexObject(prefix, obj) {
          //output.debug("BAN", obj)
          return {
            id: prefix+'_'+obj.id,
            to: obj.id,
            type: obj.type,
            expire: obj.expire,
            actions: obj.actions
          }
        }
        await input.table("security_Ban").onChange((obj, oldObj) => {
          if(obj && oldObj) {
            //output.debug("CHANGE!", obj, oldObj)
            let pointers = obj && new Set(prefixes(obj))
            let oldPointers = oldObj && new Set(prefixes(oldObj))
            for(let pointer of pointers) {
              if(!!oldPointers.has(pointer)) output.change(indexObject(pointer, obj), null)
            }
            for(let pointer of oldPointers) {
              if(!!pointers.has(pointer)) output.change(null, indexObject(pointer, oldObj))
            }
          } else if(obj) {
            //output.debug("CREATE!", obj, oldObj)
            prefixes(obj).forEach(v => output.change(indexObject(v, obj), null))
          } else if(oldObj) {
            //output.debug("DELETE!", obj, oldObj)
            prefixes(oldObj).forEach(v => output.change(null, indexObject(v, oldObj)))
          }
        })
      }
    },
  }
})

definition.event({
  name: "banCreated",
  async execute({ ban, data }) {
    Ban.create({ id: ban, ...data })
  }
})

definition.event({
  name: "banRemoved",
  async execute({ ban }) {
    Ban.delete(ban)
  }
})

definition.view({
  name: "myBans",
  properties: {},
  daoPath(params, { client, service }) {
    const keys = getClientKeysStrings(client)
    return multiKeyIndexQuery(keys, 'security_Ban_bans', Ban.tableName)
  },
})

definition.view({
  name: "myActionsBans",
  properties: {
    actions: {
      type: String
    }
  },
  daoPath({ actions }, { client, service }) {
    const keys = []
    for(const action of actions) {
      keys.push(...getClientKeysStrings(client, action + ':'))
    }
    return fastMultiKeyIndexQuery(keys, 'security_Ban_actionBans', Ban.tableName)
  },
})

definition.view({
  name: "myActionsBansByTypes",
  properties: {
    actions: {
      type: Array,
      of: {
        type: String
      }
    },
    types: {
      type: Array,
      of: {
        type: String
      }
    }
  },
  daoPath({ actions, types }, { client, service }) {
    const keys = []
    for(const type of types) {
      for (const action of actions) {
        keys.push(...getClientKeysStrings(client, action + ':',':' + type))
      }
    }
    console.log("BAN KEYS", keys)
    return ['database', 'query', app.databaseName, `(${
        async (input, output, { keys, indexName }) => {
          function mapper(obj) {
            if(!obj) return null
            const { id, to, ...safeObj } = obj
            return { ...safeObj, id: to }
          }
          function onIndexChange(obj, oldObj) {
            output.change(mapper(obj), mapper(oldObj))
          }
          await Promise.all(keys.map(async (encodedKey) => {
            const range = {
              gte: encodedKey,
              lte: encodedKey + "\xFF",
              reverse: true,
              limit: 1 // only last expire
            }
            await (await input.index(indexName)).range(range).onChange(onIndexChange)
          }))
        }
    })`, { keys, indexName: 'security_Ban_actionBansByType' }]
  },
})

/*function getBanPrefixes(keys, actions) {
  const v = keys.length
  const w = actions.length
  let res = new Array(v * w)
  for(let i = 0; i < v; i++) {
    for(let j = 0; j < w; j++) {
      const key = keys[i]
      res[i * v + j] = `${actions[j]}:${key.key}:${key.value}`
    }
  }
  return res
}*/

definition.trigger({
  name: "securityActionBan",
  properties: {
    ban: {
      type: Object,
      properties: {
        actions: banProperties.actions,
        expire: {
          type: String
        },
        type: banProperties.type
      }
    },
    keys: {
      type: Object
    }
  },
  async execute({ keys, event, ban: { actions, expire, type } }, { service }, emit) {

    console.log("SECURITY BAN!", arguments[0])

    const banKeys = []
    for(const key of keys) {
      //keys[key] = event.keys[key]
      banKeys.push({ key, value: event.keys[key] })
    }
    console.log("ACTION KEYS", event.keys, '=>', banKeys)

    const banExpire = expire && new Date(new Date().getTime() + lcp.parseDuration(expire))

    console.log("BAN KEYS", banKeys)
    console.log("BAN EXPIRE", banExpire)

    const ban = app.generateUid()

    service.trigger({
      type: 'createTimer',
      timer: {
        timestamp: banExpire.getTime() + 1000,
        service: 'security',
        trigger: {
          type: 'removeExpiredBan',
          ban
        }
      }
    })

    emit({
      type: "banCreated",
      ban,
      data: { actions, keys: banKeys, expire: banExpire, type }
    })
  }
})

definition.trigger({
  name: "removeExpiredBan",
  properties: {
    ...banProperties
  },
  async execute({ ban }, { client, service }, emit) {
    console.log("REMOVE EXPIRED BAN", ban)
    emit({
      type: "banRemoved",
      ban
    })
  }
})

export { Ban }
