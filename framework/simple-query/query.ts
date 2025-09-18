import type { 
  PropertyDefinitionSpecification, ServiceDefinition, ServiceDefinitionSpecification,
  ModelDefinition, ForeignModelDefinition
} from "@live-change/framework"

import { PropertyDefinition } from "@live-change/framework"

interface QueryParameters {
  [key: string]: any
}

interface QueryInputs {
  [key: string]: QueryInput
}

type QueryCode = ((parameters: QueryParameters, inputs: QueryInputs) => any)

interface QueryDefinitionSpecification {
  name: string
  properties: Record<string, PropertyDefinitionSpecification>
  returns?: PropertyDefinitionSpecification,
  code: QueryCode,
  sourceName: string,
  update: boolean,
}

export class QueryDefinition<SDS extends ServiceDefinitionSpecification> {

  service: ServiceDefinition<SDS>
  definition: QueryDefinitionSpecification
  properties: Record<string, PropertyDefinition<any>>

  constructor(serviceDefinition: ServiceDefinition<SDS>, definition: QueryDefinitionSpecification) {
    this.service = serviceDefinition
    this.definition = definition

    this.properties = Object.fromEntries(
      Object.entries(definition.properties)
      .map(
        ([propertyName, propertyDefinition]) => [propertyName, new PropertyDefinition(propertyDefinition)]
      )
    )

    const queryProperties = {}
    for(const propertyName in definition.properties) {
      const propertyDefinition = definition.properties[propertyName]
      const base = new QueryPropertyBase([propertyName])
      queryProperties[propertyName] = createQueryPropertyProxy(base, propertyName, this.properties[propertyName])
    }

    const queryInputs = {}
    for(const propertyName in definition.properties) {
      const propertyDefinition = definition.properties[propertyName]
      const base = new QueryInputBase(this, [propertyName])
      queryInputs[propertyName] = createQueryInputProxy(base, propertyName, this.properties[propertyName])
    }

    // run the code to collect relations
    this.definition.code(queryProperties, queryInputs)

    /// TODO: use collected relations to create indexes and prepared query
  }
}


export type QueryFactoryFunction<SDS extends ServiceDefinitionSpecification> = 
  (definition: QueryDefinitionSpecification) => QueryDefinition<SDS>

export default function queryFactory<SDS extends ServiceDefinitionSpecification>(
    serviceDefinition: ServiceDefinition<SDS>
  ) {
  const queryFactoryFunction: QueryFactoryFunction<SDS> = 
    (definition: QueryDefinitionSpecification) => new QueryDefinition<SDS>(serviceDefinition, definition)
  return queryFactoryFunction
}


type QuerySource = ModelDefinition<any> | ForeignModelDefinition | any /// Query Definition will be recursive definition, so use any for now

export class QueryInputBase {
  $source: QuerySource
  $path: string[]

  constructor(source: QuerySource, path: string[]) {
    this.$source = source
    this.$path = path
  }
}

export class QueryInput extends QueryInputBase {
  [key: string]: QueryInputBase | any /// Proxy class will be added to this
}


export function createQueryInputProxy(
  base: QueryInputBase, propertyName: string, propertyDefinition: PropertyDefinition<any>
) {
  return new Proxy(base, {
    get(target, prop, receiver) {
      const foundInBase = Reflect.get(target, prop, receiver)
      if(foundInBase) return foundInBase
      const propertyBase = new QueryInputBase(base.$source, [...base.$path, propertyName])
      const propertyProxy = createQueryInputProxy(propertyBase, propertyName, propertyDefinition)
      return propertyProxy
    }
  })
}

export class QueryPropertyBase {
  $path: string[]

  constructor(path: string[]) {
    this.$path = path
  }
}

export class QueryProperty extends QueryPropertyBase {
  [key: string]: QueryPropertyBase | any /// Proxy class will be added to this
}

export function createQueryPropertyProxy(
  base: QueryPropertyBase, propertyName: string, propertyDefinition: PropertyDefinition<any>
) {
  return new Proxy(base, {
    get(target, prop, receiver) {
      const foundInBase = Reflect.get(target, prop, receiver)
      if(foundInBase) return foundInBase
      const propertyBase = new QueryPropertyBase([...base.$path, propertyName])
      const propertyProxy = createQueryPropertyProxy(propertyBase, propertyName, propertyDefinition)
      return propertyProxy
    }
  })
}
