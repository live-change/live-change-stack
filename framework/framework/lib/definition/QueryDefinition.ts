import { AccessSpecification } from "../processors/accessMethod.js"
import PropertyDefinition, { PropertyDefinitionSpecification } from "./PropertyDefinition.js"
import type { ContextBase, QueryParameters } from "./types.js"

type QueryCode = string | ((input: any, output: any, parameters: QueryParameters) => Promise<any>)

export interface QueryDefinitionSpecification {  
  name: string
  properties: Record<string, PropertyDefinitionSpecification>
  returns?: PropertyDefinitionSpecification,
  code: QueryCode,
  sourceName: string,
  update: boolean,

  validation?: (parameters: QueryParameters, context: ContextBase) => Promise<any>
  waitForEvents?: boolean,
  timeout?: number,
  requestTimeout?: number
}

class QueryDefinition<T extends QueryDefinitionSpecification> {
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

export default QueryDefinition
