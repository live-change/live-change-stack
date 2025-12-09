import ModelDefinition, { ModelDefinitionSpecification } from "./ModelDefinition.js"
import ForeignModelDefinition from "./ForeignModelDefinition.js"
import IndexDefinition, { IndexDefinitionSpecification } from "./IndexDefinition.js"
import ForeignIndexDefinition from "./ForeignIndexDefinition.js"
import ActionDefinition, { ActionDefinitionSpecification } from "./ActionDefinition.js"
import TriggerDefinition, { TriggerDefinitionSpecification } from "./TriggerDefinition.js"
import ViewDefinition, { ViewDefinitionSpecification } from "./ViewDefinition.js"
import EventDefinition from "./EventDefinition.js"
import defaultValidators from '../utils/validators.js'
import { crudChanges, definitionToJSON } from "../utils.js"
import QueryDefinition, { QueryDefinitionSpecification } from "./QueryDefinition.js"

const PROXY_SKIP_SYMBOLS = new Set([
  Symbol.toPrimitive,
  Symbol.iterator,
  Symbol.asyncIterator,
  Symbol.toStringTag,
  Symbol.hasInstance,
  Symbol.match,
  Symbol.replace,
  Symbol.search,
  Symbol.split,
  Symbol.species
])

function proxyGet(definition, kind, name, target, prop, receiver) {
  const runtime = definition._runtime
  const objectRuntime = runtime?.[kind]?.[name]
  const objectName = target.name ?? target.constructor?.name ?? '<anonymous>'

  // For well-known symbols we don't report missing properties.
  // Prefer the runtime object if it defines the symbol.
  if (typeof prop === 'symbol' && PROXY_SKIP_SYMBOLS.has(prop)) {
    if (objectRuntime && Reflect.has(objectRuntime, prop)) {
      return Reflect.get(objectRuntime, prop, receiver)
    }
    return Reflect.get(target, prop, receiver)
  }

  // If the runtime object defines this property, it takes priority.
  if (objectRuntime && Reflect.has(objectRuntime, prop)) {
    return Reflect.get(objectRuntime, prop, receiver)
  }

  const existsInTarget = Reflect.has(target, prop)
  const existsInRuntime = Boolean(objectRuntime && Reflect.has(objectRuntime, prop))

  // Report only when the property exists neither in target nor in runtime.
  if (!existsInTarget && !existsInRuntime) {
    const propLabel = typeof prop === 'symbol' ? prop.toString() : String(prop)
    console.warn(kind, objectName, 'runtime used before created; property', propLabel, 'not found')
    console.trace()
  }

  return Reflect.get(target, prop, receiver)
}

function createModelProxy(definition, model) {
  return new Proxy(model, {
    get(target, prop, receiver) {    
      return proxyGet(definition, 'models', target.name, target, prop, receiver)
    }
  })
}

function createForeignModelProxy(definition, model) {
  return new Proxy(model, {
    get(target, prop, receiver) {
      return proxyGet(definition, 'foreignModels', model.serviceName + "_" + model.name, target, prop, receiver)
    }
  })
}

function createIndexProxy(definition, index) {
  return new Proxy(index, {
    get(target, prop, receiver) {
      return proxyGet(definition, 'indexes', index.name, target, prop, receiver)
    }
  })
}

function createForeignIndexProxy(definition, index) {
  return new Proxy(index, {
    get(target, prop, receiver) {
      return proxyGet(definition, 'foreignIndexes', index.name, target, prop, receiver)
    }
  })
}

function createQueryProxy(definition, query) {
  return new Proxy(query, {
    get(target, prop, receiver) {
      return proxyGet(definition, 'queries', query.name, target, prop, receiver)
    }
  })
}


export interface ServiceDefinitionSpecification {

}

class ServiceDefinition<T extends ServiceDefinitionSpecification> {
  [key: string]: any

  constructor(definition: T) {
    this.models = {}
    this.foreignModels = {}
    this.indexes = {}
    this.foreignIndexes = {}
    this.actions = {}
    this.views = {}
    this.internalViews = {}
    this.events = {}
    this.triggers = {}
    this.use = []
    this.processors = []
    this.authenticators = []
    this.beforeStartCallbacks = []
    this.afterStartCallbacks = []
    this.endpoints = []
    this.validators = { ...defaultValidators }
    this.clientSideFilters = []
    this.queries = {}
    // @ts-ignore
    for(let key in definition) this[key] = definition[key]
  }

  model<T extends ModelDefinitionSpecification>(definition: T) {
    if(this.models[definition.name]) throw new Error('model ' + definition.name + ' already exists')
    const model = new ModelDefinition(definition, this.name)
    this.models[model.name] = model
    return createModelProxy(this, model)
  }

  foreignModel(serviceName, modelName) {
    const model = new ForeignModelDefinition(serviceName, modelName)
    this.foreignModels[serviceName + "_" + modelName] = model
    return createForeignModelProxy(this, model)
  }

  index(definition) {
    if(this.indexes[definition.name]) throw new Error('index ' + definition.name + ' already exists')
    const index = new IndexDefinition(definition, this.name)
    this.indexes[index.name] = index
    return createIndexProxy(this, index)
  }

  foreignIndex(serviceName, indexName) {
    const index = new ForeignIndexDefinition(serviceName, indexName)
    this.foreignIndexes[serviceName + "_" + indexName] = index
    return createForeignIndexProxy(this, index)
  }

  action<T extends ActionDefinitionSpecification>(definition: T) {
    if(this.actions[definition.name]) throw new Error('action ' + definition.name + ' already exists')
    const action = new ActionDefinition<T>(definition)
    this.actions[action.name] = action
    return action
  }

  event(definition) {
    if(this.events[definition.name]) throw new Error('event ' + definition.name + ' already exists')
    const event = new EventDefinition(definition)
    this.events[event.name] = event
    return event
  }

  view<T extends ViewDefinitionSpecification>(definition: T) {
    if(this.views[definition.name]) throw new Error('view ' + definition.name + ' already exists')
    const view = new ViewDefinition<T>(definition)
    this.views[view.name] = view
    return view
  }

  trigger<T extends TriggerDefinitionSpecification>(definition: T) {
    const trigger = new TriggerDefinition(definition)
    //if(this.triggers[trigger.name]) throw new Error('trigger ' + trigger.name + ' already exists')
    this.triggers[trigger.name] = [ ...(this.triggers[trigger.name] || []) , trigger ]
    return trigger
  }

  processor(processor) {
    if(typeof processor == "function") {
      this.processors.push({
        process: processor
      })
    } else {
      this.processors.push(processor)
    }
  }

  authenticator(authenticator) {
    this.authenticators.push(authenticator)
  }

  beforeStart(callback) {
    this.beforeStartCallbacks.push(callback)
  }

  afterStart(callback) {
    this.afterStartCallbacks.push(callback)
  }

  endpoint(endpoint) {
    this.endpoints.push(endpoint)
  }

  validator(name, validator) {
    if(this.validators[name]) throw new Error('validator ' + name + ' already exists')
    this.validators[name] = validator
    console.log("VALIDATOR DEFINED", name, validator)
  }

  clientSideFilter(filter) {
    this.clientSideFilters.push(filter)
  }

  query<T extends QueryDefinitionSpecification>(definition: T) {
    if(this.queries[definition.name]) throw new Error('query ' + definition.name + ' already exists')
    const query = new QueryDefinition<T>(definition)
    this.queries[query.name] = query
    return createQueryProxy(this, query)
  }

  toJSON() {
    let models = {}
    for(let key in this.models) models[key] = this.models[key].toJSON()
    let foreignModels = {}
    for(let key in this.foreignModels) foreignModels[key] = this.foreignModels[key].toJSON()
    let indexes = {}
    for(let key in this.indexes) indexes[key] = this.indexes[key].toJSON()
    let foreignIndexes = {}
    for(let key in this.foreignIndexes) foreignIndexes[key] = this.foreignIndexes[key].toJSON()
    let actions = {}
    for(let key in this.actions) actions[key] = this.actions[key].toJSON()
    let events = {}
    for(let key in this.events) events[key] = this.events[key].toJSON()
    let views = {}
    for(let key in this.views) views[key] = this.views[key].toJSON()
    let triggers = {}
    for(let key in this.triggers) triggers[key] = this.triggers[key].map(t=>t.toJSON())
    let json = {
      ...this,
      _runtime: undefined,
      models,
      foreignModels,
      indexes,
      foreignIndexes,
      actions,
      views,
      events,
      triggers
    }
    const fixed = definitionToJSON(json, true)
    return fixed
  }

  callTrigger(trigger, data) {
    if(!this._runtime) throw new Error("triggers can be called only on runtime")
    this._runtime.trigger(trigger, data)
  }

  computeChanges( oldModuleParam ) {
    let oldModule = JSON.parse(JSON.stringify(oldModuleParam))
    let changes: Record<string, any>[] = []
    changes.push(...crudChanges(oldModule.models || {}, this.models || {},
      "Model", "model", { }))
    changes.push(...crudChanges(oldModule.indexes || {}, this.indexes || {},
      "Index", "index", { }))
    changes.push(...crudChanges(oldModule.queries || {}, this.queries || {},
      "Query", "query", { }))
    return changes
  }
}

export default ServiceDefinition
