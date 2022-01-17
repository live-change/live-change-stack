const app = require("@live-change/framework").app()
const definition = require('./definition.js')

const clientKeys = definition.config.clientKeys

function multiKeyIndexQuery(keys, indexName, tableName) {
  return ['database', 'query', app.databaseName, `(${
    async (input, output, { keys, indexName, tableName }) => {
      const objectStates = new Map()
      async function mapper(res) {
        input.table(tableName).object(res.to).get()
      }
      async function onIndexChange(obj, oldObj) {
        if(obj && !oldObj) {
          const data = await mapper(obj)
          if(data) output.change(data, null)
        }
        if(obj && obj.to) {
          let objectState = objectStates.get(obj.to)
          if(!objectState) {
            objectState = { data: undefined, refs: 1 }
            objectState.reader = input.table(tableName).object(obj.to)
            const ind = obj
            objectState.observer = await objectState.reader.onChange(async obj => {
              const data = obj
              const oldData = objectState.data
              output.change(data, oldData)
              if(data) {
                objectState.data = obj
              } else if(oldObj) {
                objectState.data = null
              }
            })
            objectStates.set(ind.to, objectState)
          } else if(!oldObj || oldObj.to != obj.to) {
            objectState.refs ++
          }
        }
        if(oldObj && oldObj.to && (!obj || obj.to != oldObj.to)) {
          let objectState = objectStates.get(oldObj.to)
          if(objectState) {
            objectState.refs --
            if(objectState.refs <= 0) {
              objectState.reader.unobserve(objectState.observer)
              objectStates.delete(oldObj.to)
              output.change(null, objectState.data)
            }
          }
        }
      }
      await Promise.all(keys.map(async (encodedKey) => {
        const range = {
          gte: encodedKey + '_',
          lte: encodedKey + "_\xFF\xFF\xFF\xFF"
        }
        await (await input.index(indexName)).range(range).onChange(onIndexChange)
      }))
    }
  })`, { keys, indexName, tableName }]
}

function getClientKeysStrings(client, prefix = '') {
  if(clientKeys) {
    return clientKeys(client).map(k => prefix + k.key + ':' + k.value)
  } else {
    const keys = []
    for(let key in client) {
      keys.push(prefix + key + ':' + client[key])
    }
    return keys
  }
}

function getClientKeysObject(client, prefix = '') {
  if(clientKeys) {
    const obj = {}
    for(const { key, value } of clientKeys(client)) {
      obj[key] = value
    }
    return obj
  } else {
    return client
  }
}

module.exports = { multiKeyIndexQuery, getClientKeysStrings, getClientKeysObject }