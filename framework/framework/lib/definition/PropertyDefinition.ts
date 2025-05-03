import { typeName, definitionToJSON } from "../utils.js"

export interface ValidationSpecificationObject {
  name: string
  [key: string]: any
}

export type ValidationSpecification = ValidationSpecificationObject | string

export interface PropertyDefinitionSpecification {
  type: string
  of?: PropertyDefinitionSpecification
  items?: PropertyDefinitionSpecification
  properties?: Record<string, PropertyDefinitionSpecification>,
  validation: ValidationSpecification[]
}

class PropertyDefinition<T extends PropertyDefinitionSpecification> {
  [key: string]: any

  constructor(definition: T) {
    // @ts-ignore
    for(let key in definition) this[key] = definition[key]
    if(definition.properties) {
      for (let propName in definition.properties) {
        const propDefn = definition.properties[propName]
        this.createAndAddProperty(propName, propDefn)
      }
    }
    if(definition.of) {
      this.of = new PropertyDefinition(definition.of)
    }
    if(definition.items) {
      this.items = new PropertyDefinition(definition.items)
    }
  }

  createAndAddProperty(name, definition) {
    const property = new PropertyDefinition(definition)
    this.properties[name] = property
  }

  toJSON() {
    let properties: Record<string, any> | undefined = undefined
    if(this.properties) {
      properties = {}
      for (let propName in this.properties) {
        properties[propName] = this.properties[propName].toJSON()
      }
    }
    const fixed = definitionToJSON(this, true)
    let json = {
      ...fixed,
      type: typeName(this.type),
      properties
    }
    if(this.of) {
      json.of = this.of.toJSON()
    }
    if(this.items) {
      json.items = this.items.toJSON()
    }
    return json
  }

  computeChanges( oldProperty, params, name) {
    let changes: Record<string, any>[] = []
    let typeChanged = false
    if(typeName(this.type) !== typeName(oldProperty.type)) typeChanged = true
    if((this.of && typeName(this.of.type)) !== (oldProperty.of && typeName(oldProperty.of.type)))
      typeChanged = true
    if((this.items && typeName(this.items.type)) !== (oldProperty.items && typeName(oldProperty.items.type)))
      typeChanged = true
    if(typeChanged) {
      changes.push({
        operation: "changePropertyType",
        ...params,
        property: name,
        ...this
      })
    }
    if(JSON.stringify(this.search) !== JSON.stringify(oldProperty.search)) {
      changes.push({
        operation: "changePropertySearch",
        ...params,
        property: name,
        ...this
      })
    }
    return changes
  }

}

export default PropertyDefinition
