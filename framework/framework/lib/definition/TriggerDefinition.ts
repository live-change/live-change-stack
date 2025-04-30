import PropertyDefinition, { PropertyDefinitionSpecification } from "./PropertyDefinition.js"

export interface TriggerDefinitionSpecification {
  name: string
  properties: Record<string, PropertyDefinitionSpecification>
  returns: PropertyDefinitionSpecification
}

class TriggerDefinition<T extends TriggerDefinitionSpecification> {
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

export default TriggerDefinition
