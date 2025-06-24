import PropertyDefinition from "./PropertyDefinition.js"
import type { PropertyDefinitionSpecification } from "./PropertyDefinition.js"
import { crudChanges, definitionToJSON } from "../utils.js"

export interface ModelIndexDefinitionSpecification {  
  property?: string | string[]
  function?: (...args: any[]) => any
  parameters?: Record<string, any>  
  storage?: any
  multi?: boolean,
}

export interface ModelPropertyDefinitionSpecification {
  type?: any,
  index?: ModelIndexDefinitionSpecification
}

export interface ModelDefinitionSpecification {
  name: string
  properties: Record<string, ModelPropertyDefinitionSpecification>
  indexes: Record<string, ModelIndexDefinitionSpecification>
  onChange: (() => void)[]
}

class ModelDefinition<T extends ModelDefinitionSpecification> {
  [key: string]: any

  constructor(definition, serviceName) {
    this.serviceName = serviceName
    this.properties = {}
    for(let key in definition) this[key] = definition[key]
    if(definition.properties) {
      for (let propName in definition.properties) {
        const propDefn = definition.properties[propName]
        this.createAndAddProperty(propName, propDefn)
      }
    }
    if(definition.onChange) {
      this.onChange = Array.isArray(definition.onChange) ? definition.onChange : [definition.onChange]
    }
  }

  getTypeName() {
    return this.serviceName + '_' + this.name
  }

  createAndAddProperty(name, definition) {
    const property = new PropertyDefinition(definition)
    this.properties[name] = property
  }

  toJSON() {
    let properties = {}
    for(let propName in this.properties) {
      properties[propName] = this.properties[propName].toJSON()
    }
    let indexes
    if(this.indexes) {
      indexes = {}
      for(let indexName in this.indexes) {
        indexes[indexName] = {
          ...this.indexes[indexName]
        }
        if(this.indexes[indexName].function) {
          indexes[indexName].function = `${this.indexes[indexName].function}`
        }
      }
    }  
    const fixed = definitionToJSON(this, true)
    return {
      ...fixed,
      properties,
      indexes
    }
  }

  computeChanges( oldModelParam ) {
    let oldModel = JSON.parse(JSON.stringify(oldModelParam))
    oldModel.indexes = oldModel.indexes || {}
    let changes: Record<string, any>[] = []
    const json = this.toJSON()
    changes.push(...crudChanges(oldModel.properties || {}, json.properties || {},
        "Property", "property", { model: this.name }))
    changes.push(...crudChanges(oldModel.indexes || {}, json.indexes || {},
        "Index", "index", { model: this.name, storage: this.storage }))
    if(oldModel.search && !this.search) changes.push({ operation: "searchDisabled", model: this.name })
    if(!oldModel.search && this.search) changes.push({ operation: "searchEnabled", model: this.name })
    if(oldModel.search && this.search && JSON.stringify(oldModel.search) !== JSON.stringify(this.search))
      changes.push({ operation: "searchUpdated", model: this.name })

    const oldStorage = oldModel.storage || {}
    const newStorage = this.storage || {}
    if(JSON.stringify(oldStorage) !== JSON.stringify(newStorage)) {
      changes.push({ operation: "storageChanged", model: this.name, oldStorage, storage: newStorage })
      for(let indexName in this.indexes) {
        changes.push({ operation: "indexStorageChanged", index: indexName, oldStorage, storage: newStorage })
      }
    }

    return changes
  }

}

export default ModelDefinition
