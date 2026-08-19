import { typeName, definitionToJSON } from "../utils.js"

export interface ValidationSpecificationObject {
  name: string
  [key: string]: any
}

export type ValidationSpecification = ValidationSpecificationObject | string

type PropertyDefinitionSpecificationType = string | StringConstructor | NumberConstructor | BooleanConstructor
 | DateConstructor | ObjectConstructor | ArrayConstructor

export interface PropertyDefinitionSpecification {
  type: PropertyDefinitionSpecificationType
  of?: PropertyDefinitionSpecification
  items?: PropertyDefinitionSpecification
  properties?: Record<string, PropertyDefinitionSpecification>,
  validation?: ValidationSpecification[]
  default?: any
}

/**
 * Structural fingerprint for DB schema diffs.
 * Only type / nesting / defaults — meta fields (description, enum, validation, search, index, …) are ignored.
 * default and defaultValue are normalized to a single `default` key.
 */
export function structuralPropertyFingerprint(prop: any): any {
  if(!prop || typeof prop !== 'object') return prop
  const out: Record<string, any> = {}
  if('type' in prop && prop.type !== undefined && prop.type !== null) {
    out.type = typeName(prop.type) ?? prop.type
  }
  if(prop.of) out.of = structuralPropertyFingerprint(prop.of)
  if(prop.items) out.items = structuralPropertyFingerprint(prop.items)
  if(prop.properties) {
    out.properties = {}
    for(const key of Object.keys(prop.properties).sort()) {
      out.properties[key] = structuralPropertyFingerprint(prop.properties[key])
    }
  }
  const defaultValue = prop.defaultValue !== undefined ? prop.defaultValue : prop.default
  if(defaultValue !== undefined) {
    out.default = defaultValue
  }
  return out
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
    const oldFp = structuralPropertyFingerprint(oldProperty)
    const newFp = structuralPropertyFingerprint(this)
    if(JSON.stringify(oldFp) !== JSON.stringify(newFp)) {
      changes.push({
        operation: "changePropertyType",
        ...params,
        property: name,
        ...this
      })
    }
    return changes
  }

}

export default PropertyDefinition
