import LcDao from "@live-change/dao"
import { prefixRange, fieldListToFieldsObject } from "../utils.js"

class ReaderModel {

  constructor(serviceName, modelName, service) {
    this.serviceName = serviceName
    this.modelName = modelName
    this.service = service
    this.tableName = this.serviceName + "_" + this.modelName
  }

  path(id) {
    return ['database', 'tableObject', this.service.databaseName, this.tableName, id]
  }

  limitedPath(id, fields) { // takes object or list of fields
    if(Array.isArray(fields)) {
      fields = fieldListToFieldsObject(fields)
    }
    fields.id = true // id is required
    return ['database', 'queryObject', this.service.databaseName, `(${
      async (input, output, { tableName, id, fields }) => {
        function mapper(obj, fields) {
          if(!obj) return obj
          const out = {}
          for(const key in fields) {
            if(typeof fields[key] == 'object') {
              out[key] = mapper(obj[key], fields[key])
            } else {
              out[key] = obj[key]
            }
          }
          return out
        }
        await input.table(tableName).object(id).onChange((obj, oldObj) =>
          output.change(mapper(obj, fields), mapper(oldObj, fields)))
      }
    })`, { tableName: this.tableName, id, fields }]
  }

  rangePath(range = {}, pathRange = null) {
    if(typeof range != 'object' || Array.isArray(range)) {
      const values = Array.isArray(range) ? range : [range]
      const prefix = values.map(value => value === undefined ? '' : JSON.stringify(value)).join(':')
      if(pathRange) {
        return this.rangePath(prefixRange(pathRange, prefix, prefix))
      }
      return this.rangePath({ gte: prefix+':', lte: prefix+'_\xFF\xFF\xFF\xFF' })
    }
    if(Array.isArray(range)) this.rangePath(range.join(','))
    return ['database', 'tableRange', this.service.databaseName, this.tableName, range]
  }

  indexRangePath(index, range = {}, pathRange = null) {
    if(typeof range != 'object' || Array.isArray(range)) {
      const values = Array.isArray(range) ? range : [range]
      const prefix = values.map(value => value === undefined ? '' : JSON.stringify(value)).join(':')
      if(pathRange) {
        return this.indexRangePath(index, prefixRange(pathRange, prefix, prefix))
      }
      return this.indexRangePath(index, { gte: prefix+':', lte: prefix+'_\xFF\xFF\xFF\xFF' })
    }
    return ['database', 'query', this.service.databaseName, `(${
        async (input, output, { tableName, indexName, range }) => {
          if(range.reverse) output.setReverse(true)
          const objectStates = new Map()
          const mapper = async (res) => input.table(tableName).object(res.to).get()
          await (await input.index(indexName)).range(range).onChange(async (obj, oldObj) => {
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
              } else if(!oldObj || oldObj.to !== obj.to) {
                objectState.refs ++
              }
            }
            if(oldObj && oldObj.to && (!obj || obj.to !== oldObj.to)) {
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
          })
        }
    })`, { indexName: this.tableName+'_'+index, tableName: this.tableName, range },
      this.modelName+'.indexRange'
    ]
  }

  sortedIndexRangePath(index, range = {}, pathRange = null) {
    if(typeof range != 'object' || Array.isArray(range)) {
      const values = Array.isArray(range) ? range : [range]
      const prefix = values.map(value => value === undefined ? '' : JSON.stringify(value)).join(':')
      if(pathRange) {
        return this.sortedIndexRangePath(index, prefixRange(pathRange, prefix, prefix))
      }
      return this.sortedIndexRangePath(index, { gte: prefix+':', lte: prefix+'_\xFF\xFF\xFF\xFF' })
    }
    return ['database', 'query',  this.service.databaseName, `(${
      async (input, output, { tableName, indexName, range }) => {
        if(range.reverse) output.setReverse(true)
        const outputStates = new Map()
        const mapper = async (res) => {
          const obj = await input.table(tableName).object(res.to).get()
          return obj && {
            ...obj,
            id: res.id, to: res.to
          } || null
        }
        await (await input.index(indexName)).range(range).onChange(async (obj, oldObj) => {
          //output.debug("INDEX CHANGE", obj, oldObj)
          if(obj && !oldObj) {
            const data = await mapper(obj)
            if(data) output.change(data, null)
          }
          if(obj) {
            let outputState = outputStates.get(obj.id)
            if(!outputState) {
              outputState = { data: undefined, refs: 1 }
              outputState.reader = input.table(tableName).object(obj.to)
              const ind = obj
              outputStates.set(obj.id, outputState)
              outputState.observer = await outputState.reader.onChange(async obj => {
                //output.debug("OBJ CHANGE", obj, "IN INDEX", ind, "REFS", outputState.refs)
                if(outputState.refs <= 0) return
                const data = obj && { ...obj, id: ind.id, to: ind.to } || null
                const oldData = outputState.data
                output.change(data, oldData)
                outputState.data = data || null
              })
            } else if(!oldObj) {
              outputState.refs ++
            }
          } else if(oldObj && oldObj.to) {
            let outputState = outputStates.get(oldObj.id)
            if(outputState) {
              outputState.refs --
              output.debug("INDEX DELETE", oldObj.id, "REFS", outputState.refs)
              if(outputState.refs <= 0) {
                outputState.reader.unobserve(outputState.observer)
                outputStates.delete(oldObj.id)
                output.change(null, outputState.data)
              }
            }
          }
        })
      }
    })`, { indexName: this.tableName+'_'+index, tableName: this.tableName, range },
      this.modelName+'.sortedIndexRange'
    ]
  }

  indexObjectPath(index, range = {}, pathRange = null) {
    if(typeof range != 'object' || Array.isArray(range)) {
      const values = Array.isArray(range) ? range : [range]
      const prefix = values.map(value => value === undefined ? '' : JSON.stringify(value)).join(':')
      if(pathRange) {
        return this.indexObjectPath(index, prefixRange(pathRange, prefix, prefix))
      }
      return this.indexObjectPath(index,{ gte: prefix+':', lte: prefix+'_\xFF\xFF\xFF\xFF' })
    }
    return ['database', 'queryObject', this.service.databaseName, `(${
        async (input, output, { tableName, indexName, range }) => {
          let objectReader = null
          let objectObserverPromise = null
          let object = null
          const objectChangeCallback = async (obj, oldObj) => {
            await output.change(obj, object)
            object = obj
          }
          await (await input.index(indexName)).range(range).onChange(async (obj, oldObj) => {
            //if(obj && oldObj && obj.to == oldObj.to) return
            if(objectObserverPromise) {
              const reader = objectReader
              objectObserverPromise.then(observer => reader.unobserve(observer))
            }
            objectObserverPromise = null
            objectReader = null
            if(obj && obj.to) {
              objectReader = input.table(tableName).object(obj.to)
              objectObserverPromise = objectReader.onChange(objectChangeCallback)
              await objectObserverPromise
            } else {
              output.change(null, object)
            }
          })
        }
    })`, { indexName: this.tableName+'_'+index, tableName: this.tableName, range }]
  }

  countPath(range = {}, pathRange = null) {
    if(typeof range != 'object' || Array.isArray(range)) {
      const values = Array.isArray(range) ? range : [range]
      const prefix = values.map(value => value === undefined ? '' : JSON.stringify(value)).join(':')
      if(pathRange) {
        return this.countPath(prefixRange(pathRange, prefix, prefix))
      }
      return this.countPath({ gte: prefix+':', lte: prefix+'_\xFF\xFF\xFF\xFF' })
    }
    if(Array.isArray(range)) this.rangePath(range.join(','))
    return ['database', 'tableCount', this.service.databaseName, this.tableName, range]
  }

  observable(id) {
    return this.service.dao.observable(this.path(id), LcDao.ObservableValue)
  }
  async get(id) {
    return this.service.dao.get(this.path(id), LcDao.ObservableValue)
  }
  rangeObservable(range) {
    return this.service.dao.observable(this.rangePath(range), LcDao.ObservableList)
  }
  async rangeGet(range) {
    return this.service.dao.get(this.rangePath(range), LcDao.ObservableList)
  }
  indexRangeObservable(index, range, pathRange = null) {
    return this.service.dao.observable(this.indexRangePath(index, range, pathRange), LcDao.ObservableList)
  }
  async indexRangeGet(index, range, pathRange = null) {
    return this.service.dao.get(this.indexRangePath(index, range, pathRange), LcDao.ObservableList)
  }
  indexObjectObservable(index, range, pathRange = null) {
    return this.service.dao.observable(this.indexObjectPath(index, range, pathRange))
  }
  async indexObjectGet(index, range, pathRange) {
    return this.service.dao.get(this.indexObjectPath(index, range, pathRange))
  }
  sortedIndexRangeObservable(index, range, pathRange = null) {
    return this.service.dao.observable(this.sortedIndexRangePath(index, range, pathRange), LcDao.ObservableList)
  }
  async sortedIndexRangeGet(index, range, pathRange = null) {
    return this.service.dao.get(this.sortedIndexRangePath(index, range, pathRange), LcDao.ObservableList)
  }
  countObservable(range) {
    return this.service.dao.observable(this.countPath(range), LcDao.ObservableList)
  }
  async countGet(range) {
    return this.service.dao.get(this.countPath(range), LcDao.ObservableList)
  }

  condition(id, condition = x => !!x, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const observable = this.observable(id)
      const timeoutId = setTimeout(() => {
        observable.unobserve(observer)
        return reject(new Error('timeout'))
      }, timeout)
      const observer = (signal, value) => {
        if(signal !== 'set') {
          observable.unobserve(observer)
          clearTimeout(timeoutId)
          return reject(new Error(`unknown signal ${signal}`))
        }
        if(condition(signal)) {
          observable.unobserve(observer)
          clearTimeout(timeoutId)
          return resolve(value)
        }
      }
      observable.observe(observer)
    })
  }

}

export default ReaderModel
