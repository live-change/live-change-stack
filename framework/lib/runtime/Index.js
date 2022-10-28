const ReactiveDao = require("@live-change/dao")
const utils = require("../utils.js");

class Index {

  constructor(serviceName, indexName, service) {
    this.serviceName = serviceName
    this.indexName = indexName
    this.service = service
    this.dbIndexName = this.serviceName + "_" + this.indexName
  }

  path(id) {
    return ['database', 'indexObject', this.service.databaseName, this.dbIndexName, id]
  }

  rangePath(range = {}, pathRange = null) {
    if(typeof range != 'object' || Array.isArray(range)) {
      const values = Array.isArray(range) ? range : [range]
      const prefix = values.map(value => value === undefined ? '' : JSON.stringify(value)).join(':')
      if(pathRange) {
        return this.rangePath(utils.prefixRange(pathRange, prefix, prefix))
      }
      return this.rangePath({ gte: prefix+':', lte: prefix+'_\xFF\xFF\xFF\xFF' })
    }
    if(Array.isArray(range)) this.rangePath(range.join(','))
    return ['database', 'indexRange', this.service.databaseName, this.dbIndexName, range]
  }

  observable(id) {
    return this.service.dao.observable(this.path(id), ReactiveDao.ObservableValue)
  }

  async get(id) {
    return this.service.dao.get(this.path(id), ReactiveDao.ObservableValue)
  }

  rangeObservable(range, pathRange = null) {
    return this.service.dao.observable(this.rangePath(range, pathRange), ReactiveDao.ObservableList)
  }

  async rangeGet(range, pathRange = null) {
    return this.service.dao.get(this.rangePath(range, pathRange), ReactiveDao.ObservableList)
  }

}

module.exports = Index
