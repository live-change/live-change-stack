import ReaderModel from "./ReaderModel.js"
import { prefixRange }from "../utils.js"

class Model extends ReaderModel {

  constructor(definition, service) {
    super(service.name, definition.name, service)
    this.service = service
    this.definition = definition
  }

  async update(id, data, options) {
    const operations = Array.isArray(data) ? data : [{ op: 'merge', property: null, value: data }]
    const res = await this.service.dao.request(
        ['database', 'update'], this.service.databaseName, this.tableName, id, operations, options)
    return res
  }

  async delete(id, options) {
    id = id.id || id
    const res = await this.service.dao.request(
        ['database', 'delete'], this.service.databaseName, this.tableName, id, options)
  }

  async create(data, options) {
    if(!data.id) throw new Error("id must be generated before creation of object")
    let prepData = { ...data }
    for(let key in this.definition.properties) {
      if(!prepData.hasOwnProperty(key)) {
        let prop = this.definition.properties[key]
        if (prop.hasOwnProperty('defaultValue')) {
          prepData[key] = prop.defaultValue
        }
        if (prop.hasOwnProperty('default')) {
          prepData[key] = prop.default
        }
      }
    }
    //console.log("CREATE PREP DATA", prepData)
    const res = await this.service.dao.request(
        ['database', 'put'], this.service.databaseName, this.tableName, prepData, options)
    return res
  }

  rangeDelete(range = {}, pathRange = null) {
    if(typeof range != 'object' || Array.isArray(range)) {
      const values = Array.isArray(range) ? range : [range]
      const prefix = values.map(value => value === undefined ? '' : JSON.stringify(value)).join(':')
      if(pathRange) {
        return this.rangePath(prefixRange(pathRange, prefix, prefix))
      }
      return this.rangePath({ gte: prefix+':', lte: prefix+'_\xFF\xFF\xFF\xFF' })
    }
    if(Array.isArray(range)) this.rangePath(range.join(','))
    this.service.dao.request(['database', 'query'], this.service.databaseName, `(${
      async (input, output, { tableName, range }) => {
        await (await input.table(tableName)).range(range).onChange(async (obj, oldObj) => {
          output.table(tableName).delete(obj.id)
        })
      }
    })`, { tableName: this.tableName, range })
  }

  indexRangeDelete(index, range = {}, pathRange = null) {
    if(typeof range != 'object' || Array.isArray(range)) {
      const values = Array.isArray(range) ? range : [range]
      const prefix = values.map(value => value === undefined ? '' : JSON.stringify(value)).join(':')
      if(pathRange) {
        return this.indexRangeDelete(index, prefixRange(pathRange, prefix, prefix))
      }
      return this.indexRangeDelete(index,{ gte: prefix+':', lte: prefix+'_\xFF\xFF\xFF\xFF' })
    }
    this.service.dao.request(['database', 'query'], this.service.databaseName, `${
      async (input, output, { tableName, indexName, range }) => {
        await (await input.index(indexName)).range(range).onChange(async (ind, oldInd) => {
          output.table(tableName).delete(ind.to)
        })
      }
    })`, { indexName: this.tableName+'_'+index, tableName: this.tableName, range })
  }

  indexRangeUpdate(index, update, range = {}, pathRange = null) {
    if(typeof range != 'object' || Array.isArray(range)) {
      const values = Array.isArray(range) ? range : [range]
      const prefix = values.map(value => value === undefined ? '' : JSON.stringify(value)).join(':')
      if(pathRange) {
        return this.indexRangeUpdate(index, update, prefixRange(pathRange, prefix, prefix))
      }
      return this.indexRangeUpdate(index, update,{ gte: prefix+':', lte: prefix+'_\xFF\xFF\xFF\xFF' })
    }
    const operations = Array.isArray(update) ? update : [{ op:'merge', property: null, value: update }]
    this.service.dao.request(['database', 'query'], this.service.databaseName, `(${
      async (input, output, { tableName, indexName, range, operations }) => {
        await (await input.index(indexName)).range(range).onChange(async (ind, oldInd) => {
          output.table(tableName).update(ind.to, operations)
        })
      }
    })`, { indexName: this.tableName+'_'+index, tableName: this.tableName, range, operations })
  }

}

export default Model