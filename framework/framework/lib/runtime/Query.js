import { prepareParameters, processReturn, preFilterParameters } from "./params.js"

class Query {

  constructor(definition, service) {
    this.definition = definition
    this.service = service
    this.queryKey = `${service.name}.${definition.name}`
    this.isObjectQuery = definition.returns?.type !== Array && definition.returns?.type !== 'Array' 
                 && definition.returns?.type !== 'array'
    this.codeString = typeof definition.code === 'function' ? `(${definition.code.toString()})` : definition.code
  }

  async run(parameters, context) {
    if(!this.definition.update) throw new Error("Only update queries can be run")
    
    if(!parameters) parameters = {}
    if(!context) context = {
      client: {
        session: null,
        user: null,
        ip: null,
        roles: []
      },
      service: this.service,
    }
    
    let preparedParams = await prepareParameters(parameters, this.definition.properties, this.service)        

    const resultPromise = this.service.app.dao.requestWithSettings({
      timeout: this.definition.timeout,
    }, ['database', 'runQuery'], this.service.app.databaseName, 'queries', this.queryKey, preparedParams)
    
    resultPromise.catch(error => {
      console.error(`Query ${this.definition.name} error `, error.stack || error)
    })
    return resultPromise
  }

  get(parameters, context) {
    if(this.definition.update) throw new Error("Only non-update queries can be get")
    
    if(!parameters) parameters = {}
    if(!context) context = {
      client: {
        session: null,
        user: null,
        ip: null,
        roles: []
      },
      service: this.service,
    }

    const resultPromise = this.service.app.dao.get([
      'database', this.definition.isObjectQuery ? 'runQueryObject' : 'runQuery', 
      this.service.app.databaseName, 'queries', this.queryKey, parameters
    ])
    resultPromise.catch(error => {
      console.error(`Query ${this.definition.name} error `, error.stack || error)
    })
    return resultPromise
  }

  observable(parameters, context) {
    if(this.definition.update) throw new Error("Only non-update queries can be observable")
    if(!parameters) parameters = {}
    if(!context) context = {
      client: {
        session: null,
        user: null,
        ip: null,
        roles: []
      },
      service: this.service,
    }

    const resultPromise = this.service.app.dao.observable([
      'database', this.definition.isObjectQuery ? 'runQueryObject' : 'runQuery', 
      this.service.app.databaseName, 'queries', this.queryKey, parameters
    ])
    resultPromise.catch(error => {
      console.error(`Query ${this.definition.name} error `, error.stack || error)
    })
    return resultPromise
  }

  toJSON() {
    return {
      name: this.definition.name,
      properties: this.definition.properties,
      returns: this.definition.returns,
      code: this.codeString,
      sourceName: this.definition.sourceName,
      update: this.definition.update,
      timeout: this.definition.timeout,
      requestTimeout: this.definition.requestTimeout,
    }
  }
}

export default Query
