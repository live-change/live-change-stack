import PropertyDefinition, { PropertyDefinitionSpecification } from "./PropertyDefinition.js"

import type { ExecutionContext } from "./types.js"

export interface ViewDefinitionSpecificationBase {
  name: string
  properties: Record<string, PropertyDefinitionSpecification>
  returns: PropertyDefinitionSpecification
}

export interface ViewContext extends ExecutionContext {  
}

export interface ViewDefinitionSpecificationObservable extends ViewDefinitionSpecificationBase {
  observable: (parameters: Record<string, any>, context: ViewContext) => any
  get: (parameters: Record<string, any>, context: ViewContext) => Promise<any>
}

export interface ViewDefinitionSpecificationDaoPath extends ViewDefinitionSpecificationBase {
  daoPath: (parameters: Record<string, any>, context: ViewContext) => any[]
}

export interface ViewDefinitionSpecificationFetch extends ViewDefinitionSpecificationBase {
  fetch: (parameters: Record<string, any>, context: ViewContext) => Promise<any>
}

export type ViewDefinitionSpecification = 
  ViewDefinitionSpecificationObservable | ViewDefinitionSpecificationDaoPath | ViewDefinitionSpecificationFetch

class ViewDefinition<T extends ViewDefinitionSpecification> {
  [key: string]: any

  constructor(definition: T) {
    this.properties = {}
    // @ts-ignore
    for(let key in definition) this[key] = definition[key]
    if(definition.properties) {
      for (let propName in definition.properties) {
        const propDefn = definition.properties[propName]
        this.createAndAddProperty(propName, propDefn)
      }
    }
    if(definition.returns) {
      this.returns = new PropertyDefinition(definition.returns)
    }
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
    let returns = this.returns ? this.returns.toJSON() : null
    return {
      ... this,
      properties,
      returns
    }
  }

}

export default ViewDefinition
