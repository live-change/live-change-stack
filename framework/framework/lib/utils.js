
function typeName(type) {
  if(!type) return null
  if(type &&  typeof type == "function") return type.name
  if(type.getTypeName) return type.getTypeName()
  return type
}
/*
function typeName( type ) {
  switch(type) {
    case String : return "String"
    case Number : return "Number"
    case Boolean : return "Boolean"
    case Array : return "Array"
    case Map : return "Map"
    default:
      if(type instanceof DataType) return type.name
      return "Object"
  }
}*/

function toJSON(data) {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if(!value) return value
    if(typeof value == "function") return value.name
    if(value.toJSON) return value.toJSON(true)
    return value
  }))
}

export function definitionToJSON(definition, ignoreRoot = false) {
  if(!definition) return definition
  if(!ignoreRoot) {
    if(typeof definition.getTypeName === 'function')
      return definition.getTypeName()
    if(typeof definition.toJSON === 'function')
      return definition.toJSON()
  }
  if(typeof definition !== 'object') return definition
  if(Array.isArray(definition)) {
    return definition.map(d => definitionToJSON(d))
  }
  return Object.fromEntries(Object.entries(definition).map(
    ([key, value]) => [key, definitionToJSON(value)])
  )
}

function setDifference(setA, setB) {
  var difference = new Set(setA)
  for (let elem of setB) difference.delete(elem)
  return difference
}

function mapDifference(mapA, mapB) {
  var difference = new Map(mapA)
  for (let key of mapB.keys()) difference.delete(key)
  return difference
}

function crudChanges(oldElements, newElements, elementName, newParamName, params = {}) {
  let changes = []
  for(let newElementName in newElements) {
    let oldElement = oldElements[newElementName]
    const newElement = newElements[newElementName]
    let renamedFrom = null
    if(newElement.oldName) {
      let oldNames = newElement.oldName.constructor === Array ? newElement.oldName : [ newElement.oldName ]
      for(let oldName of oldNames) {
        if(oldElements[oldName]) {
          renamedFrom = oldName
          oldElement = oldElements[renamedFrom]
          oldElement.renamed = true
          break;
        }
      }
    }
    if(renamedFrom) {
      let change = {
        operation: "rename"+elementName,
        ...params,
        from: renamedFrom,
        to: newElementName,
      }
      change[newParamName] = newElement
      changes.push(change)
    }
    if(!oldElement) {
      if(newElement) {
        let change ={
          operation: "create"+elementName,
          name: newElementName,
          ...params
        }
        change[newParamName] = newElement.toJSON ? newElement.toJSON() : newElement
        changes.push(change)
      }
    } else {
      if(newElement.computeChanges) {
        changes.push(...newElement.computeChanges(oldElement, params, newElementName))
      } else if(
          JSON.stringify({ ...oldElement, created: undefined })
          !== JSON.stringify({ ...newElement, created: undefined })
      ) {
        let change = {
          operation: "delete"+elementName,
          ...params,
          name: newElementName
        }
        change[newParamName] = oldElement.toJSON ? oldElement.toJSON() : oldElement
        changes.push(change)
        change = {
          operation: "create" + elementName,
          name: newElementName,
          ...params
        }
        change[newParamName] = newElement.toJSON ? newElement.toJSON() : newElement
        changes.push(change)
      }
    }
  }
  for(let oldElementName in oldElements) {
    const oldElement = oldElements[oldElementName]
    if(!newElements[oldElementName] && !oldElement.renamed) {
      let change = {
        operation: "delete"+elementName,
        ...params,
        name: oldElementName
      }
      change[newParamName] = oldElement.toJSON ? oldElement.toJSON() : oldElement
      changes.push(change)
    }
  }
  return changes
}

function getProperty(of, propertyName) {
  const path = propertyName.split('.')
  let p = of
  for(let part of path) p = p.properties[part]
  return p
}

function setProperty(of, propertyName, value) {
  const path = propertyName.split('.')
  let t = of
  for(let part of path.slice(0,-1)) {
    t.properties = t.properties || {}
    t.properties[part] = t.properties[part] || {}
    t.type = t.type || Object
    t = t.properties[part]
  }
  const last = path[path.length-1]
  t.properties = t.properties || {}
  t.type = t.type || Object
  t.properties[last] = value
}

function getField(of, fieldName) {
  const path = fieldName.split('.')
  let p = of
  for(let part of path) p = p[part]
  return p
}
function setField(of, fieldName, value) {
  const path = propertyName.split('.')
  let t = of
  for(let part of path.slice(0,-1)) {
    t[part] = t[part] || {}
    t = t[part]
  }
  const last = path[path.length-1]
  t[last] = value
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item))
}

function mergeDeep(target, ...sources) {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeep(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return mergeDeep(target, ...sources);
}

function getDefaults(properties) {
  let result = {}
  for(const propName in properties) {
    const property = properties[propName]
    if(property.hasOwnProperty('defaultValue')) {
      result[propName] = property.defaultValue
    } else if(property.hasOwnProperty('default')) {
      result[propName] = property.default
    } else if(property.type === Object) {
      const defaults = getDefaults(property.properties)
      if(Object.keys(defaults).length > 0) result[propName] = defaults
    }
  }
  return result
}

function getUpdates(properties) {
  let result = {}
  for(const propName in properties) {
    const property = properties[propName]
    if(property.hasOwnProperty('updated')) {
      result[propName] = property.updated
    } else if(property.type === Object) {
      const updates = getUpdates(property.properties)
      if(Object.keys(updates).length > 0) result[propName] = updates
    }
  }
  return result
}

function prefixRange({ gt, lt, gte, lte, limit, reverse }, prefix, from = "") {
  function getPrefix(id) {
    if(id.length > from.length) {
      if(id.slice(0, from.length) !== from) {
        console.error("ID:", id, "does not start with", from)
        throw new Error("id does not match prefix")
      }
      id = id.slice(from.length)
    }
    if(id === '') return `${prefix}:`
    if(id === '\xFF\xFF\xFF\xFF') return `${prefix}:\xFF\xFF\xFF\xFF`
    return `${prefix}${id}`
  }

  return {
    gt: (typeof gt == 'string') ? getPrefix(gt)+"\xFF\xFF\xFF\xFF" : undefined,
    lt: (typeof lt == 'string') ? getPrefix(lt) : undefined,
    gte: (typeof gte == 'string') ? getPrefix(gte) : (typeof gt == 'string' ? undefined : `${prefix}:`),
    lte: (typeof lte == 'string')
        ? getPrefix(lte)+"\xFF\xFF\xFF\xFF"
        : (typeof lt == 'string' ? undefined : `${prefix}_\xFF\xFF\xFF\xFF`),
    limit,
    reverse
  }
}

const rangeProperties = {
  gt: {
    type: String,
  },
  lt: {
    type: String,
  },
  gte: {
    type: String,
  },
  lte: {
    type: String,
  },
  limit: {
    type: Number
  },
  reverse: {
    type: Boolean
  }
}

function fieldListToFieldsObject(fieldList) {
  const fields = {}
  for(const fieldName of fieldList) {
    const parts = fieldName.split('.')
    let at = fields
    let i = 0
    for(; i < parts.length - 1; i ++) {
      if(!at[parts[i]]) at[parts[i]] = {}
      at = at[parts[i]]
    }
    at[parts[i]] = true
  }
  return fields
}

function encodeIdentifier(parts) {
  if(!Array.isArray(parts)) {
    return parts
  }
  return parts.map(p => JSON.stringify(p)).join(':')
}

function extractRange(properties) {
  return {
    gt: properties.gt,
    gte: properties.gte,
    lt: properties.lt,
    lte: properties.lte,
    reverse: properties.reverse,
    limit: properties.limit
  }
}

function isomorphic( v ) {
  if(typeof v == 'function') {
    return {
      isomorphic: true,
      function: v
    }
  }
  return {
    isomorphic: true,
    value: v
  }
}

function computeValues(source, properties, context) {
  const result = {}
  for(const propName in source) {
    switch(typeof source[propName]) {
      case 'function': {
        result[propName] = source[propName](properties, context)
        break
      }
      case 'object': {
        result[propName] = source[propName] && computeValues(source[propName], properties[propName], context)
        break
      }
      default: {
        result[propName] = source[propName]
      }
    }
  }
  return JSON.parse(JSON.stringify(result))
}

function computeDefaults(model, properties, context) {
  const defaults = getDefaults(model.properties)
  return computeValues(defaults, properties, context)
}

function computeUpdates(model, properties, context) {
  const updates = getUpdates(model.properties)
  return computeValues(updates, properties, context)
}

export {
  typeName, toJSON, setDifference, mapDifference, crudChanges,
  getProperty, setProperty, getField, setField, isObject, mergeDeep, getDefaults,
  prefixRange, rangeProperties, fieldListToFieldsObject,
  encodeIdentifier, extractRange, isomorphic, computeDefaults, computeUpdates
}

export function parseDuration(duration) {
  if(typeof duration === 'number') return duration
  const match = duration.match(/(\d+)([smhd])/g)
  if(!match || match.length === 0) throw new Error(`Invalid duration: ${duration}`)
  let result = 0
  for(const m of match) {
    const value = parseInt(m.slice(0, -1))
    const unit = m.slice(-1)
    result += value * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit]
  }
  return result
}

import { logs, SeverityNumber } from '@opentelemetry/api-logs'
import { context } from '@opentelemetry/api'

export function loggingHelper(logger, severityNumber, severityText, attributes) {
  return (message, ...args) => {  
    logger.emit({
      severityNumber, severityText,
      body: [message, ...args].map(a => {
        try {
          return JSON.parse(JSON.stringify(a))
        } catch (e) {
          return `${a}`
        }
      }).join(' '),
      attributes: {
        ...attributes,
        'log.type': 'LogRecord',
        message,        
        logArgs: args.map(a => {
          try {
            return JSON.parse(JSON.stringify(a))
          } catch (e) {
            return `${a}`
          }
        }),
      },
      context: context.active()
    })
  }
}

export function loggingHelpers(name, version, attributes, options) {
  const logger = logs.getLogger(name, version, options)
  return {
    log: loggingHelper(logger, SeverityNumber.INFO, 'INFO', attributes),
    warn: loggingHelper(logger, SeverityNumber.WARN, 'WARN', attributes),
    error: loggingHelper(logger, SeverityNumber.ERROR, 'ERROR', attributes),
    debug: loggingHelper(logger, SeverityNumber.DEBUG, 'DEBUG', attributes),
    trace: loggingHelper(logger, SeverityNumber.TRACE, 'TRACE', attributes),
    fatal: loggingHelper(logger, SeverityNumber.FATAL, 'FATAL', attributes),    
  }
}
