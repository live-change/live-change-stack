import { 
  PropertyDefinitionSpecification, ServiceDefinition, ServiceDefinitionSpecification  
} from "@live-change/framework"

import { 
  ModelDefinition, ForeignModelDefinition, ContextBase, QueryParameters as FrameworkQueryParameters,
  QueryDefinition as FrameworkQueryDefinition, 
  QueryDefinitionSpecification as FrameworkQueryDefinitionSpecification,
  ViewDefinition,
  EventDefinition,
  TriggerDefinition,
  ActionDefinition,
  ViewDefinitionSpecificationDaoPath
} from "@live-change/framework"

import { PropertyDefinition } from "@live-change/framework"

import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import { accessSync, readFileSync } from 'fs'

const simpleIndexCodePath = resolve(dirname(fileURLToPath(import.meta.url)), 'simpleIndex.db.js')
const simpleIndexCode = readFileSync(simpleIndexCodePath, 'utf8').replace('export {};', '')
const simpleQueryCodePath = resolve(dirname(fileURLToPath(import.meta.url)), 'simpleQuery.db.js')
const simpleQueryCode = readFileSync(simpleQueryCodePath, 'utf8').replace('export {};', '')


interface Range {
  gt?: string 
  gte?: string
  lt?: string
  lte?: string,
  reverse?: boolean,
  limit?: number,
}

interface QueryParameters {
  [key: string]: any
}

interface QueryInputs {
  [key: string]: QueryInput
}

class CanBeStatic {
  $_markStatic() {
    this[staticRuleSymbol] = true
  }

  $_isStatic() {
    return this[staticRuleSymbol]
  }
}

class RuleSource {
  rule: QueryRule
  input: QueryInput
  type: string
  dependentBy: RuleSource[]
  dependsOn: RuleSource[]
  index: IndexInfo | null

  constructor(rule: QueryRule, input: QueryInput, source: QuerySource, type: string) {
    this.rule = rule
    this.input = input
    this.type = type
    this.dependentBy = []
    this.dependsOn = []
  }
}


class QueryRule extends CanBeStatic {
  $_hasStaticParameter() {
    return false
  }

  $_getSources(): RuleSource[] {
    return []
  }

  $_equals(other: QueryRule) {
    return false
  }

  $_parametersJSON(resultParameters: string[]) {
    return undefined
  }
}

type QueryRules = QueryRule[]

type QueryCode = ((parameters: QueryParameters, inputs: QueryInputs) => QueryRules)

type QuerySource = ModelDefinition<any> | ForeignModelDefinition | any /// Query Definition will be recursive definition, so use any for now


interface QueryDefinitionSpecification {
  name: string
  properties: Record<string, PropertyDefinitionSpecification>
  returns?: PropertyDefinitionSpecification,
  sources?: Record<string, QuerySource>,
  code?: QueryCode,
  update?: boolean,
  id: Function,
  timeout?: number,
  requestTimeout?: number,
  validation?: (parameters: FrameworkQueryParameters, context: ContextBase) => Promise<any>
  view?: Record<string, any>
  event?: Record<string, any>
  trigger?: Record<string, any>
  action?: Record<string, any>
}

class OutputMapping {
  result: string
  path: string[]
  alias: string

  constructor(result: string, path: string[], alias: string) {
    this.result = result
    this.path = path
    this.alias = alias
  }

  getDescription(indent: string = "") {
    return `OutputMapping(${this.result}.${this.path.join(".")}, ${this.alias})`
  }

  equals(other: OutputMapping) {
    return this.result === other.result && this.path.join(".") === other.path.join(".") && this.alias === other.alias
  }
}

class IndexInfo {
  singleSource: QuerySource | null = null
  rules: QueryRule[]
  indexParts: OutputMapping[]
  name: string
  sources: QuerySource[]

  constructor(rules: QueryRule[], indexParts: OutputMapping[], service: ServiceDefinition<any>, name: string = undefined) {
    this.rules = rules    
    this.indexParts = indexParts
    this.sources = rules.map(rule => rule.$_getSources()).flat()
    const firstSource = this.sources[0]
    if(this.sources.every(source => source === firstSource)) this.singleSource = firstSource    
    if(this.singleSource) {      
      this.name = name || ''
      + (this.singleSource.input.$source.serviceName === service.name ? "" : service.name + "_")
      + (
        this.singleSource.input.$source.getTypeName() + "_" + (indexParts
        .map(part => part.path.join(".")).join("_"))
      )
    } else {
      this.name = name || ''
      + (this.sources.every(source => source.input.$source.serviceName === service.name) ? "" : service.name + "_")      
      + (
        indexParts.map(part => {
          const source = this.sources.find(source => source.input.$alias === part.result)
          if(!source) throw new Error("Source not found for index part: " + part)
          return source.input.$source.getTypeName() + "_" + part.path.join(".")
        }).join("_")
      )
    }
  }

  equals(other: IndexInfo) {
    if(this.rules.length !== other.rules.length) return false
    if(this.name !== other.name) return false
    if(this.indexParts.length !== other.indexParts.length) return false
    if(this.indexParts.some((part, i) => part !== other.indexParts[i])) return false
    for(let i = 0; i < this.rules.length; i++) {
      if(this.rules[i].$_equals(other.rules[i])) return false
    }
    return true
  }

  getDescription(indent: string = "") {
    return `Index(${this.name}, `+
           ((this.rules.length > 0)
             ? `\n${indent}  ${this.rules.map(rule => queryDescription(rule, indent + "  ")).join("\n  "+indent)}`
             : "")+
           `\n${indent}  ${this.indexParts.map(part => part.getDescription(indent + "  ")).join("\n  "+indent)}`+
           `\n${indent})`
  }

  $_executionJSON() {    
    if(!this.singleSource) throw new Error("Indexes with multiple sources are not supported")
    return {
      sourceType: "index",
      name: this.name,
      alias: this.singleSource.input.$alias + 'Indexed'
    }
  }

  $_createQuery(service: ServiceDefinition<any>) {
    return new QueryDefinition(service, {
      name: this.name,
      properties: {},
      id: (x:any) => x
    }, this.rules)
  }
}

const staticRuleSymbol = Symbol("static")

type ExecutionStep = {
  execution: any,
  next: ExecutionStep[]
}

export class QueryDefinition<SDS extends ServiceDefinitionSpecification> {

  service: ServiceDefinition<SDS>
  definition: QueryDefinitionSpecification
  properties: Record<string, PropertyDefinition<any>>
  rules: QueryRules
  idFields: QueryInputLike[] | null
  firstRule: QueryRule
  rootSources: RuleSource[]
  ruleSources: RuleSource[]
  indexes: IndexInfo[]

  executionPlan: ExecutionStep[]
  indexPlan: ExecutionStep[]

  preparedQuery: FrameworkQueryDefinition<FrameworkQueryDefinitionSpecification>

  constructor(
    serviceDefinition: ServiceDefinition<SDS>, definition: QueryDefinitionSpecification, rules: QueryRule[] = undefined
  ) {
    this.service = serviceDefinition
    this.definition = definition

    this.properties = Object.fromEntries(
      Object.entries(definition.properties)
      .map(
        ([propertyName, propertyDefinition]) => [propertyName, new PropertyDefinition(propertyDefinition)]
      )
    )

    if(rules) {
      this.rules = rules
    } else {
      this.computeRules()
    }

    this.markStaticRules()

    //this.printRules()

    this.computeDependencies()
    this.computeIndexes()

    //this.printDependencies() 

   // process.exit(0)

  }

  printRules() {
    console.log("QUERY RULES:")
    for(const key in this.rules) {      
      console.log(`  ${key}:`, queryDescription(this.rules[key], '  '))
    }
  }

  printIdFields() {
    console.log("ID FIELDS:")
    if(this.idFields) {
      for(const idField of this.idFields) {
        console.log(`  `, queryDescription(idField, '  '))
      }
    }
  }

  computeRules() {
    const queryProperties = {}
    for(const propertyName in this.definition.properties) {
      const propertyDefinition = this.definition.properties[propertyName]
      const base = new QueryPropertyBase([propertyName])
      queryProperties[propertyName] = createQueryPropertyProxy(base, propertyName, this.properties[propertyName])
    }

    const queryInputs = {}
    for(const sourceName in this.definition.sources) {
      const propertyDefinition = this.definition.sources[sourceName]
      const base = new QueryInputBase(this.definition.sources[sourceName], [], sourceName)
      queryInputs[sourceName] = createQueryInputProxy(base)
    }

    // run the code to collect relations
    this.rules = this.definition.code(queryProperties, queryInputs)
    this.idFields = this.definition.id ? this.definition.id(queryInputs) : null
  }

  markStaticRules() {
    for(const key in this.rules) {
      const rule = this.rules[key]
      markStatic(rule)
    }
  }

  computeDependencies() {
    const independentRules = this.rules.filter(rule => rule.$_hasStaticParameter())
    if(independentRules.length > 1) {    
      console.error("Independent rules:")
      for(const rule of independentRules) {
        console.error('  ' + queryDescription(rule, '  '))
      }
      throw new Error("Multiple independent rules are not supported")
    }
    this.firstRule = independentRules[0] ?? this.rules[0]    
    this.rootSources = this.firstRule.$_getSources()
    const providedSources = this.rootSources.slice()

    const otherSources = []
    for(const rule of this.rules) {
      if(rule === this.firstRule) continue
      const ruleSources = rule.$_getSources()
      for(const ruleSource of ruleSources) {
        otherSources.push(ruleSource)
      }
    }

    this.ruleSources = this.rootSources.concat(otherSources)  

    while(otherSources.length > 0) {
      /// find sources to link
      let linked = false
      for(const ruleSource of otherSources) {
        for(const providedSource of providedSources) {
          if(ruleSource == providedSource) {
            throw new Error("Rule source is equal to provided source")
          }
          /* console.log("RULE SOURCE", queryDescription(ruleSource.source, '  '))
          console.log("PROVIDED SOURCE", queryDescription(providedSource.source, '  '))
          console.log("MATCH", ruleSource.source === providedSource.source) */
          if(ruleSource.input.$_canBeUsedAsSource(providedSource.input)) {
            ruleSource.dependsOn.push(providedSource)
            providedSource.dependentBy.push(ruleSource)
            otherSources.splice(otherSources.indexOf(ruleSource), 1)
            
            for(const otherRuleSource of this.ruleSources) {
              if(otherRuleSource.rule !== ruleSource.rule) continue
              if(otherRuleSource === ruleSource) continue
              if(providedSources.find(s => s === otherRuleSource)) continue
              providedSources.push(otherRuleSource)
              otherSources.splice(otherSources.indexOf(otherRuleSource), 1)
            }
            linked = true
            break
          }
          if(linked) break;
        }
      }
      if(!linked && otherSources.length > 0) {
        console.error("Impossible to link query, found independent sources:")
        for(const ruleSource of otherSources) {
          console.error('  ' + queryDescription(ruleSource, '  '))
        }
        throw new Error("Impossible to link query, found independent sources")
      }
    }
  }

  printDependencies(indent: string = '') {
    console.log('QUERY DEPENDENCIES:')
    for(const key in this.rules) {
      const rule = this.rules[key]
      console.log(`${indent}  RULE ${key}:`)
      console.log(`${indent}    ${queryDescription(rule, indent + '    ')}`)
      console.log(`${indent}    SOURCES:`)
      for(const ruleSource of this.ruleSources) {
        if(ruleSource.rule !== rule) continue
        console.log(`${indent}      ${queryDescription(ruleSource.input.$source, indent + '      ')} as ${ruleSource.input.$alias}`)
        if(ruleSource.dependsOn.length > 0) {
          console.log(`${indent}        DEPENDS ON: `+
            `${ruleSource.dependsOn.map(d => this.rules.indexOf(d.rule)).join(', ')}`
          )          
        }
        if(ruleSource.dependentBy.length > 0) {
          console.log(`${indent}        DEPENDENT BY: `+
            `${ruleSource.dependentBy.map(d => this.rules.indexOf(d.rule)).join(', ')}`
          )
        }
        if(ruleSource.index) {
          console.log(`${indent}        ${ruleSource.index.getDescription(indent + '        ')}`)
        }
      }     
    }
  }

  computeIndexes() {
    this.indexes = []
    for(const ruleSource of this.ruleSources) {
      const potentialIndex = ruleSource.input.$_getIndexInfo(this.indexes, this.service)
      if(!potentialIndex) continue
      const existingIndex = this.indexes.find(index => index.equals(potentialIndex))
      if(existingIndex) {
        ruleSource.index = existingIndex
        continue
      }
      this.indexes.push(potentialIndex)
      ruleSource.index = potentialIndex
    }
  }

  computeSourceExecutionPlan(source: RuleSource, resultParameters: string[]) {    
    /// TODO: Może trzeba wprowadzić analizę tego co mamy i co chcemy uzyskać w przyszłości ?

    const next = source.dependentBy.map(dependent => {
      const otherSource = this.ruleSources.find(s => s.rule === dependent.rule && s != dependent)
      const nextStep = this.computeSourceExecutionPlan(otherSource, [...resultParameters, source.input.$alias])
      return nextStep
    })

    console.log("COMPUTING SOURCE EXECUTION PLAN FOR", source.input.$_toQueryDescription(), "WITH", resultParameters)
    console.log("RULE", queryDescription(source.rule, '  '))

    const ruleParameters = JSON.parse(JSON.stringify(source.rule.$_parametersJSON(resultParameters)))
    console.log("RULE PARAMETERS", ruleParameters)
    const mandatory = this.idFields?.find(idField => source.input.$alias === idField.$alias) ? true : undefined
    if(source.index) {                  
      const indexExecution = {
        ...source.index.$_executionJSON(),
        by: parameterEnsureRange(ruleParameters[Object.keys(ruleParameters)[0]])
      }
      /// TODO: decide if id field is mandatory - if exports aliases that are required in id Fields or market mandatory      
      const indexNext = [{
        execution: {
          operation: 'object',
          ...source.input.$_executionJSON(),          
          by: {
            type: 'result',
            path: [indexExecution.alias, source.index.indexParts.at(-1).alias],
          },
        },
        mandatory,
        next
      }]
      return {
        execution: indexExecution,
        next: indexNext
      }
    }

    const execution = {
      ...source.input.$_executionJSON(),      
      by: ruleParameters[Object.keys(ruleParameters)[0]]
    }    
    const executionPlan = {
      execution,
      mandatory,
      next
    }
    return executionPlan
  }

  computeExecutionPlan() {
    this.executionPlan = []
    for(const rootSource of this.rootSources) {
      this.executionPlan.push(this.computeSourceExecutionPlan(rootSource, []))
    }
  }

  computeSourceIndexPlan(source: RuleSource, resultParameters: string[], processed: RuleSource[], allProcessed: RuleSource[]) {    
    allProcessed.push(source)
    const ruleSources = this.ruleSources
      .filter(s => s.input.$source === source.input.$source && s != source && !processed.includes(s))
    const next = ruleSources.map(ruleSource => {            
      const otherSource = this.ruleSources.find(s => s.rule === ruleSource.rule && s != ruleSource)    
      if(!otherSource) return null
      if(processed.includes(otherSource)) return null
      return this.computeSourceIndexPlan(
        otherSource,
        [...resultParameters, source.input.$alias],
        [...processed, source],
        allProcessed
      )
    }).filter(s => s !== null)
    const ruleParameters = JSON.parse(JSON.stringify(source.rule.$_parametersJSON(resultParameters)))
    if(source.index) {                  
      const indexExecution = {
        ...source.index.$_executionJSON(),
        by: ruleParameters[Object.keys(ruleParameters)[0]]
      }
      const indexNext = [{
        operation: 'object',
        ...source.input.$_executionJSON(),
        by: {
          type: 'result',
          path: [indexExecution.alias, source.index.indexParts.at(-1).alias],
        },
        next
      }]
      return {
        execution: indexExecution,
        next: indexNext
      }
    }  
    const execution = {
      ...source.input.$_executionJSON(),
      by: ruleParameters[Object.keys(ruleParameters)[0]],
    }    
    const executionPlan = {
      execution,
      next
    }
    return executionPlan
  }

  computeIndexPlan(endMapping: OutputMapping[] = undefined) {
    const indexSources = []
    for(const ruleSource of this.ruleSources) {
      const source = ruleSource.input.$source
      if(indexSources.includes(source)) continue
      indexSources.push(source)
    }
    this.indexPlan = indexSources.map(source => {
      const firstFetch = {
        sourceType: sourceType(source),
        name: source.getTypeName(),
        alias: source.getTypeName(),
        by: { type: 'object', properties: {} } /// infinite range
      }      
      const ruleSources = this.ruleSources.filter(s => s.input.$source === source)
      const ruleSourcesAliases = Array.from(new Set(ruleSources.map(s => s.input.$alias)))
      const next:ExecutionStep[] = ruleSourcesAliases.map((alias) => {        
        const processed = []

        const aliasRuleSources = ruleSources.filter(s => s.input.$alias === alias)
        const next:ExecutionStep[] = aliasRuleSources.map((input) => {
          const rule = input.rule
          const output = this.ruleSources.find(s => s.rule === rule && s != input)
          if(!output) return null
          const ignoredSources = ruleSources.filter(s => s.input.$source === source && s.input.$alias === input.input.$alias)
          const executionPlan = this.computeSourceIndexPlan(output, [firstFetch.alias], [input, ...ignoredSources], processed)        
          executionPlan.execution.by = { type: 'result', path: [firstFetch.alias, ...input.input.$path] }
          return { 
            ...executionPlan,         
          }
        }).filter(s => s !== null)

        const baseMapping = {
          [alias]: [firstFetch.alias],          
        }
        for(const processedSource of processed) {
          baseMapping[processedSource.input.$alias] = [processedSource.input.$alias]
        }
        let mapping = baseMapping
        if(endMapping) {
          mapping = {}
          for(const mp of endMapping) {
            const base = baseMapping[mp.result]
            if(!base) throw new Error("Base mapping "+mp.result+" not found")
            mapping[mp.alias] = base.concat(mp.path)
          }
        }
        const execution = {
          operation: 'output',
          mapping
        }
        return {
          execution,
          next
        }
      }).filter(s => s !== null)
      return {
        execution: firstFetch,
        next
      }
    })
  }

  createIndexes() {
    //console.log("CREATE INDEXES", this.indexes)

    /* for(const index of this.indexes) {
      const indexQuery = index.$_createQuery(this.service)
      indexQuery.createIndex(index.name, index.indexParts)
    } */

    const indexesWithQueries = this.indexes.map(index => ({ info: index, query: index.$_createQuery(this.service) }))
    for(const indexQuery of indexesWithQueries) {
      //console.log("CREATE INDEX", indexQuery.info.name)
      //this.printRules()
      //console.log("OUTPUT MAPPINGS", indexQuery.info.indexParts)
      indexQuery.query.computeIndexPlan(indexQuery.info.indexParts)
      //console.log("INDEX", indexQuery.info.name, "PLAN", JSON.stringify(indexQuery.query.indexPlan, null, 2))
    }

    for(let i = 0; i < indexesWithQueries.length; i++) {
      const a = indexesWithQueries[i]
      for(let j = i+1; j < indexesWithQueries.length; j++) {
        const b = indexesWithQueries[j]
        const plansMatch = JSON.stringify(a.query.indexPlan) === JSON.stringify(b.query.indexPlan)
        if(plansMatch) {
          if(a.info.name !== b.info.name) {
            console.log("INDEXES HAVE THE SAME PLAN", a.info.name, b.info.name, "but different names => merge")
            b.info.name = a.info.name
          } else {
            console.error("INDEXES HAVE THE SAME PLAN AND NAME", a.info.name)
          }
          indexesWithQueries.splice(j, 1)
          j--
          continue
        }
        if(a.info.name === b.info.name) { // check for collision
          console.error("INDEXES HAVE THE SAME NAME", a.info.name, "but different plans => error")
          console.log("PLAN A", JSON.stringify(a.query.indexPlan, null, 2))
          console.log("PLAN B", JSON.stringify(b.query.indexPlan, null, 2))
          throw new Error("INDEXES HAVE THE SAME NAME " + a.info.name + " but different plans")
        }        
      }
    }

    for(const index of indexesWithQueries) {
      if(this.service.indexes[index.info.name.slice(this.service.name.length+1)]) {
        if(JSON.stringify(this.indexPlan)
           === JSON.stringify(this.service.indexes[index.info.name.slice(this.service.name.length+1)].parameters.plan)) 
          continue
        console.error("INDEX", index.info.name, "ALREADY EXISTS BUT DIFFERENT PLAN")
        throw new Error("INDEX" + index.info.name + "ALREADY EXISTS BUT DIFFERENT PLAN")
      }
      this.service.index({
        name: index.info.name.slice(this.service.name.length+1),
        function: simpleIndexCode,
        sourceName: simpleIndexCodePath,
        parameters: {
          plan: index.query.indexPlan
        }   
      })
    }
  }

  prepareQuery() {
    this.createIndexes()

    console.log("########### PREPARING QUERY!!!!")    

    this.printRules()

    this.printIdFields()

    this.printDependencies()

    this.computeExecutionPlan()
    console.log("EXECUTION PLAN:")
    console.log(JSON.stringify(this.executionPlan, null, 2))

    //process.exit(0)

    const idFunctionCode = (typeof this.definition.id === 'string')
      ? this.definition.id : `(${this.definition.id})`
  
    console.log("ID FUNCTION", idFunctionCode)

    this.preparedQuery = this.service.query({
      name: this.definition.name,
      properties: this.definition.properties,
      returns: this.definition.returns,
      code: simpleQueryCode,
      sourceName: simpleQueryCodePath,
      update: this.definition.update,
      timeout: this.definition.timeout,
      requestTimeout: this.definition.requestTimeout,
      validation: this.definition.validation,
      config: {
        plan: this.executionPlan,
        idFunction: idFunctionCode
      },
      view: this.definition.view,
      trigger: this.definition.trigger,
      action: this.definition.action,
      event: this.definition.event
    })
 
    return this.preparedQuery
  }

  createIndex(name, mapping: OutputMapping[]) {    
    console.log("CREATE INDEX", name)
    this.printRules()
    console.log("OUTPUT MAPPINGS", mapping)
    this.computeIndexPlan(mapping)
    console.log("INDEX", name, "PLAN", JSON.stringify(this.indexPlan, null, 2))
    /// TODO: create index from query

    if(this.service.indexes[name]) {
      if(JSON.stringify(this.indexPlan) === JSON.stringify(this.service.indexes[name].parameters.plan)) 
        return
      console.error("INDEX", name, "ALREADY EXISTS BUT DIFFERENT PLAN")
      throw new Error("INDEX" + name + "ALREADY EXISTS BUT DIFFERENT PLAN")
    }

    this.service.index({
      name,
      function: simpleIndexCode,
      sourceName: simpleIndexCodePath,
      parameters: {
        plan: this.indexPlan
      }   
    })

    //process.exit(0)
  }
}

function parameterIsRange(parameter: any) {
  if(typeof parameter !== 'object' || parameter === null) return false
  if(Array.isArray(parameter)) return parameterIsRange(parameter.at(-1))
  if(parameter.type === 'object') return true  
  return false
}

function parameterEnsureRange(parameter: any) {
  if(parameterIsRange(parameter)) return parameter  
  if(Array.isArray(parameter)) return [...parameter, { type: 'object', properties: {} }]
  return {
    type: 'array',
    items: [parameter, { type: 'object', properties: {} }]
  }  
}


export type QueryFactoryFunction<SDS extends ServiceDefinitionSpecification> = 
  (definition: QueryDefinitionSpecification) => QueryDefinition<SDS>

export default function queryFactory<SDS extends ServiceDefinitionSpecification>(
    serviceDefinition: ServiceDefinition<SDS>
  ) {
  const queryFactoryFunction: QueryFactoryFunction<SDS> = 
    (definition: QueryDefinitionSpecification) => {
      const query = new QueryDefinition<SDS>(serviceDefinition, definition)
      query.prepareQuery()
      return query
    }
  return queryFactoryFunction
}

type RuleInput = QueryInputLike | QueryPropertyBase | any

function getSource(input: RuleInput): QuerySource {
  if(input instanceof QueryInputBase) return input.$source
  return null
}

function isStatic(element: any) {
  if(typeof element !== "object" || element === null) return true
  return element instanceof CanBeStatic ? element.$_isStatic() : 
    ((element.constructor.name === "Object" || element.constructor.name === "Array") 
      ? element[staticRuleSymbol] 
      : false)  
}

function queryDescription(element: any, indent: string = "") {  
  const flags = isStatic(element) ? "static " : ""
  if(typeof element !== "object" || element === null) return flags + element.toString()
  if(typeof element.$_toQueryDescription === "function") 
    return flags + element.$_toQueryDescription(indent)
  const fields = Object.entries(element)
    .map(([key, value]) => `${indent}  ${key}: ${queryDescription(value, indent + "  ")}`)
    .join("\n")
  if(element.constructor.name !== "Object") return flags + `${element.constructor.name}(\n${fields})`
  return flags + '{\n'+fields+`\n${indent}}`;
}

function markStatic(element: any) {
  if(element instanceof CanBeStatic) return element.$_markStatic()
  if(typeof element === "object" && element !== null) {    
    let allStatic = true
    for(const key in element) {
      markStatic(element[key])
      if(!isStatic(element[key])) allStatic = false
    }
    if(allStatic) element[staticRuleSymbol] = true
    return
  }  
}

function parameterJSON(element: any) {
  if(typeof element !== "object" || element === null) return element
  if(element instanceof QueryPropertyBase) return { type: 'property', path: element.$path }
  if(Array.isArray(element)) return element.map(item => parameterJSON(item))
  const output = {
    type: 'object',
    properties: {}
  }
  for(const key in element) {
    output.properties[key] = parameterJSON(element[key])
  }  
  return output
}

function parametersJSONForInput(input: RuleInput, resultParameters: string[]) {
  if(isStatic(input)) {
    return parameterJSON(input)        
  } else if(typeof input.$_parametersJSON === "function") {
    return input.$_parametersJSON(resultParameters)
  } else {
    const resultParameter = resultParameters.find(p => p === input.$alias)
    if(resultParameter) {
      return {
        type: 'result',
        path: [resultParameter, ...input.$path],
      }
    }
    //throw new Error("Result parameter not found for input: "+input.$alias)
  }
}

export class RangeRule extends QueryRule {
  $input: RuleInput
  $range: RuleInput

  constructor(input: QueryInputLike, range: Range) {
    super()
    this.$input = input
    this.$range = range
  }

  $_toQueryDescription(indent: string = "") {
    return `Range(`+
           `\n${indent}  ${queryDescription(this.$input, indent + "  ")}`+
           `\n${indent}  ${queryDescription(this.$range, indent + "  ")}`+
           `\n${indent})`
  }

  $_markStatic() {
    markStatic(this.$input)
    markStatic(this.$range)    
    //console.log("MARK STATIC", queryDescription(this.$input), queryDescription(this.$range), isStatic(this.$input), isStatic(this.$range))
    this[staticRuleSymbol] = isStatic(this.$input) && isStatic(this.$range)
  }

  $_isStatic() {
    return this[staticRuleSymbol]
  }

  $_hasStaticParameter() {
    return isStatic(this.$input) || isStatic(this.$range)
  }

  $_getSources(): RuleSource[] {
    return [
      new RuleSource(this, this.$input, getSource(this.$input), 'range')
    ].filter(s => s.input?.$source != null)
  }

  $_parametersJSON(resultParameters: string[]) {
    return {
      input: parametersJSONForInput(this.$input, resultParameters),
      range: parametersJSONForInput(this.$range, resultParameters),
    }   
  }
}

export class EqualsRule extends QueryRule {
  $inputA: RuleInput
  $inputB: RuleInput

  constructor(inputA: RuleInput, inputB: RuleInput) {
    super()
    this.$inputA = inputA
    this.$inputB = inputB
  }

  $_toQueryDescription(indent: string = "") {
    return `Equals(`+
           `\n${indent}  ${queryDescription(this.$inputA, indent + "  ")}`+
           `\n${indent}  ${queryDescription(this.$inputB, indent + "  ")}`+
           `\n${indent})`
  }

  $_markStatic() {
    markStatic(this.$inputA)
    markStatic(this.$inputB)
    this[staticRuleSymbol] = isStatic(this.$inputA) && isStatic(this.$inputB)
  }

  $_isStatic() {
    return this[staticRuleSymbol]
  }

  $_hasStaticParameter() {
    return isStatic(this.$inputA) || isStatic(this.$inputB)
  }

  $_getSources(): RuleSource[] {
    return [
      new RuleSource(this, this.$inputA, getSource(this.$inputA), 'object'), 
      new RuleSource(this, this.$inputB, getSource(this.$inputB), 'object')
    ].filter(s => s.input?.$source != null)
  }

  $_parametersJSON(resultParameters: string[]) {
    return {
      inputA: parametersJSONForInput(this.$inputA, resultParameters),
      inputB: parametersJSONForInput(this.$inputB, resultParameters),
    }   
  }
}

function sourceType(source: QuerySource) {
  return (source instanceof ModelDefinition || source instanceof ForeignModelDefinition)
    ? "table" : "index"
}

export interface QueryInputLike {  
  $source: QuerySource
  $alias: string

  $get(...path: string[]): QueryInputLike
  $inside(range: Range): QueryRule
  $equals(value: any): QueryRule
  $concat(...input: QueryInputLike[]): QueryInputLike

  $_markStatic()
  $_isStatic()
  $_canBeUsedAsSource(input: QueryInputLike)
  $_getIndexInfo(indexes: IndexInfo[], serviceDefinition: ServiceDefinition<any>): IndexInfo | null
  $_executionJSON()
  $_equals(other: QueryInputLike)

  $_toQueryDescription(indent: string): string
}

export class CompoundQueryInputBase implements QueryInputLike {
  $source: QuerySource
  $paths: string[][]
  $alias: string

  constructor(source: QuerySource, paths: string[][], alias: string) {    
    this.$source = source
    this.$paths = paths
    this.$alias = alias
  }

  $get(...path: string[]): QueryInputLike {
    throw new Error('compound inputs does not have fields, while fetching field: '+path.join(".")+' of '+this.$alias)
  }

  $inside(range: Range) {
    return new RangeRule(this, range)
  }

  $equals(value: any) {
    return new EqualsRule(this, value)
  }

  $concat(...input: QueryInputLike[]) {
    if(!input.every(i => i.$source === this.$source)) throw new Error('concat only supports inputs from the same source')
    return new CompoundQueryInputBase(this.$source, [...this.$paths, ...input.map(i => {
      if(i instanceof CompoundQueryInputBase) return i.$paths
      if(i instanceof QueryInputBase) return [i.$path]
      throw new Error('concat only supports QueryInputBase and CompoundQueryInputBase')
    }).flat()], this.$alias)
  }


  $_markStatic() {
    /// ignore - QueryInput is not static
  }

  $_isStatic() {
    return false
  }

  $_canBeUsedAsSource(input: QueryInputLike) {
    return this.$source === input.$source && this.$alias === input.$alias
  }


  $_getIndexInfo(indexes: IndexInfo[], serviceDefinition: ServiceDefinition<any>): IndexInfo | null {
    return new IndexInfo([
      new RangeRule(this, {}),
    ], [
      ...this.$paths.map(path => new OutputMapping(this.$alias, path, path.join("_"))),      
      new OutputMapping(this.$alias, ['id'], 'to')
    ], serviceDefinition)
  }

  $_executionJSON() {    
    return {
      sourceType: sourceType(this.$source),
      name: this.$source.getTypeName(),
      alias: this.$alias
    }
  }
  $_equals(other: QueryInputLike) {
    if(!(other instanceof CompoundQueryInputBase)) return false
    return this.$source === other.$source 
      && this.$paths.length === other.$paths.length
      && this.$paths.every((path, i) => path.join(".") === other.$paths[i].join(".")) 
      && this.$alias === other.$alias
  }

  $_toQueryDescription(indent: string = "") {
    return `CompoundQueryInput(\n${indent}  source: ${queryDescription(this.$source, indent + "  ")}`+
                      `\n${indent}  paths: ${this.$paths.map(path => path.join(".")).join(", ")}`+
                      `\n${indent}  alias: ${this.$alias}`+
                      `\n${indent})`
  }

  $_parametersJSON(resultParameters: string[]) {
    const resultParameter = resultParameters.find(p => p === this.$alias)    
    if(resultParameter) {
      return this.$paths.map(path => ({
        type: 'result',
        path: [resultParameter, ...path],
      }))      
    }
  }
}

export class QueryInputBase extends CanBeStatic implements QueryInputLike {
  $source: QuerySource
  $path: string[]
  $alias: string

  $inside(range: Range) {
    return new RangeRule(this, range)
  }

  $equals(value: any) {
    return new EqualsRule(this, value)
  }

  $get(...path: string[]): QueryInputLike {
    return new QueryInputBase(this.$source, [...this.$path, ...path], this.$alias)
  }

  $concat(...input: QueryInputLike[]) {
    if(!input.every(i => i.$source === this.$source)) throw new Error('concat only supports inputs from the same source')
    return new CompoundQueryInputBase(this.$source, [this.$path, ...input.map(i => {
      if(i instanceof CompoundQueryInputBase) return i.$paths
      if(i instanceof QueryInputBase) return [i.$path]
      throw new Error('concat only supports QueryInputBase and CompoundQueryInputBase')
    }).flat()], this.$alias)
  }

  /** 
   * @returns corresponding type property 
   * */
  $type() {
    const typePath:string[] = [
      ...this.$path.slice(0, -1), 
      this.$path[this.$path.length - 1] + 'Type'
    ]
    return createQueryInputProxy(new QueryInputBase(this.$source, typePath, this.$alias))
  }

  /**
   * Transforms property to typed property adding propertyType property
   * @returns typed property multiple fields key
   */
  $typed() {
    return this.$type().$concat(this)
  }

  $as(alias: string) {
    return createQueryInputProxy(new QueryInputBase(this.$source, this.$path, alias))
  }

  constructor(source: QuerySource, path: string[], alias: string = undefined) {
    super()
    this.$source = source
    this.$path = path
    this.$alias = alias
  }

  $_toQueryDescription(indent: string = "") {
    return `QueryInput(\n${indent}  source: ${queryDescription(this.$source, indent + "  ")}`+
                      `\n${indent}  path: ${this.$path.join(".")}`+
                      `\n${indent}  alias: ${this.$alias}`+
                      `\n${indent})`
  }

  $_markStatic() {
    /// ignore - QueryInput is not static
  }

  $_isStatic() {
    return false
  }

  $_canBeUsedAsSource(input: QueryInputBase) {
    return this.$source === input.$source && this.$alias === input.$alias
  }

  $_getIndexInfo(indexes: IndexInfo[], serviceDefinition: ServiceDefinition<any>): IndexInfo | null {
    if(this.$path.length === 0) return null // id is used
    if(this.$path.length === 1 && this.$path[0] === "id") return null // id is used
    return new IndexInfo([
      new RangeRule(this, {}),
    ], [
      new OutputMapping(this.$alias, this.$path, this.$path.join("_")),
      new OutputMapping(this.$alias, ['id'], 'to')
    ], serviceDefinition)
  }

  $_executionJSON() {    
    return {
      sourceType: sourceType(this.$source),
      name: this.$source.getTypeName(),
      alias: this.$alias
    }
  }
  $_equals(other: QueryInputLike) {
    if(!(other instanceof QueryInputBase)) return false
    return this.$source === other.$source && this.$path.join(".") === other.$path.join(".") && this.$alias === other.$alias
  }

  $_parametersJSON(resultParameters: string[]) {
    const resultParameter = resultParameters.find(p => p === this.$alias)    
    if(resultParameter) {
      return {
        type: 'result',
        path: [resultParameter, ...this.$path],
      }
    }
  }
}

export class QueryInput extends QueryInputBase {
  [key: string]: QueryInputBase | any /// Proxy class will be added to this
}


export function createQueryInputProxy(
  base: QueryInputLike
) {
  return new Proxy(base, {
    get(target, prop, receiver) {
      const foundInBase = Reflect.get(target, prop, receiver)
      if(foundInBase) return foundInBase      
      const newBase = target.$get(prop as string)
      const inputProxy = createQueryInputProxy(newBase)
      return inputProxy
    }
  })
}

export class QueryPropertyBase extends CanBeStatic {
  $path: string[]

  constructor(path: string[]) {
    super()
    this.$path = path
  }

  $_toQueryDescription(indent: string = "") {
    return `QueryProperty(${this.$path.join(".")})`
  }

  $_isStatic() {
    return true
  }

  $_markStatic() {
    /// ignore - QueryProperty is always static
  }

  $_executionJSON() {
    return {
      type: "property",
      path: this.$path
    }
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
