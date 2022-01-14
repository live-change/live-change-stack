const app = require("@live-change/framework").app()
const definition = require('./definition.js')
const { getClientKeysStrings } = require('./utils.js')
const lcp = require('@live-change/pattern')

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
        const values = (ban) => {
          const v = ban.keys.length
          const w = ban.actions.length
          let res = new Array(v * w)
          for(let i = 0; i < v; i++) {
            for(let j = 0; j < w; j++) {
              const key = ban.keys[i]
              res[i * v + j] = `${ban.actions[j]}:${key.key}:${key.value}`
            }
          }
          return res
        }
        await input.table("securityService_Ban").onChange((obj, oldObj) => {
          if(obj && oldObj) {
            let pointers = obj && new Set(values(obj))
            let oldPointers = oldObj && new Set(values(oldObj))
            for(let pointer of pointers) {
              if(!!oldPointers.has(pointer)) output.change({ id: pointer+'_'+obj.id, to: obj.id }, null)
            }
            for(let pointer of oldPointers) {
              if(!!pointers.has(pointer)) output.change(null, { id: pointer+'_'+obj.id, to: obj.id })
            }
          } else if(obj) {
            values(obj).forEach(v => output.change({ id: v+'_'+obj.id, to: obj.id }, null))
          } else if(oldObj) {
            values(oldObj).forEach(v => output.change(null, { id: v+'_'+obj.id, to: obj.id }))
          }
        })
      }
    }
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
    return multiKeyIndexQuery(keys, 'Ban_bans')
  },
})

definition.view({
  name: "myActionBans",
  properties: {
    action: {
      type: String
    }
  },
  daoPath({ action }, { client, service }) {
    const keys = getClientKeysStrings(client, action + ':')
    return multiKeyIndexQuery(keys, 'Ban_actionBans')
  },
})

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
    const ban = app.generateUid()

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

    // service.trigger({
    //   type: 'createTimer',
    //   timer: {
    //     timestamp: banExpire.getTime() + 1000,
    //     service: 'security',
    //     trigger: {
    //       type: 'removeExpiredBan',
    //       ban
    //     }
    //   }
    // })

    // emit({
    //   type: "banCreated",
    //   ban,
    //   data: { actions, banKeys, expire, type }
    // })
  }
})

definition.trigger({
  name: "removeExpiredBan",
  properties: {
    ...banProperties
  },
  async execute({ ban }, {client, service}, emit) {
    emit({
      type: "banRemoved",
      ban
    })
  }
})

module.exports = { Ban }
