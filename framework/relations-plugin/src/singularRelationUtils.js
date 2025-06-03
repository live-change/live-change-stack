import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, TriggerDefinition
} from "@live-change/framework"
import {
  extractIdentifiers,
  extractObjectData,
  generateId,
  extractIdParts,
  prepareAccessControl,
  cloneAndPrepareAccessControl,
  defineIndex
} from './utils.js'
import { fireChangeTriggers } from "./changeTriggers.js"
import { extractTypeAndIdParts } from './utilsAny.js'
import { allCombinations } from './combinations.js'
import pluralize from 'pluralize'

export function createIdentifiersProperties(keys, types, idField) {
  const identifiers = {}
  if(keys) for(let i = 0; i < keys.length; i++) {
    const key = keys[i]
    identifiers[key] = {
      type: types?.[i] || String,
      validation: idField ? [{ name: 'ifEmpty', prop: idField, then: ['nonEmpty'] }] : ['nonEmpty']
    }
  }
  if(idField) identifiers[idField] = {
    type: String,
    validation: keys.map(key => ({ name: 'ifEmpty', prop: key, then: ['nonEmpty'] }))
  }
  return identifiers
}

export function defineObjectView(config, context, external = true) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model, modelPropertyName } = context
  const viewProperties = createIdentifiersProperties(otherPropertyNames, others, modelPropertyName)
  const viewName = config.name
    || ((config.prefix ? config.prefix + modelName : modelName[0].toLowerCase() + modelName.slice(1)) + (config.suffix || ''))
  model.crud.read = viewName
  const sourceAccessControl = external && (config.readAccessControl || config.writeAccessControl)
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, 
    otherPropertyNames.concat(modelPropertyName), 
    others.concat(model))
  service.view({
    name: viewName,
    properties: {
      ...viewProperties
    },
    returns: {
      type: model,
    },
    internal: !external,
    global: config.globalView,
    access: external && (config.readAccess || config.writeAccess),
    accessControl,
    daoPath(properties, { client, context }) {
      const idProp = modelPropertyName ? properties[modelPropertyName] : null
      if(idProp) {
        const path = config.fields ? modelRuntime().limitedPath(idProp, config.fields) : modelRuntime().path(idProp)
        return path
      }
      const id = idProp ? idProp : idParts.length > 1 ? idParts.map(p => JSON.stringify(p)).join(':') : idParts[0]
      const path = config.fields ? modelRuntime().limitedPath(id, config.fields) : modelRuntime().path(id)
      return path
    }
  })
}

export function defineRangeViews(config, context, external = true) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model } = context
  const identifierCombinations = allCombinations(Object.keys(otherPropertyNames)).slice(0, -1)
  const sourceAccessControl = external
    && (config.listAccessControl || config.readAccessControl || config.writeAccessControl)
  for(const combination of identifierCombinations) {
    const combinationKeys = combination.map(prop => otherPropertyNames[prop])
    const combinationTypes = combination.map(prop => others[prop])
    const propsUpperCase = combinationKeys.map(prop => prop[0].toUpperCase() + prop.slice(1))
    const indexName = 'by' + combinationKeys.map(prop => prop[0].toUpperCase() + prop.slice(1)).join('And')
    const viewName = combinationKeys[0][0].toLowerCase() + combinationKeys[0].slice(1) +
      propsUpperCase.slice(1).join('And') + context.partialReverseRelationWord + pluralize(modelName)
    model.crud['rangeBy_'+combinationTypes.join('And')] = viewName
    //console.log("DEFINE RANGE VIEW", viewName, combination)
    const identifiers = createIdentifiersProperties(combinationKeys, combinationTypes)
    const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, combinationKeys, combinationTypes)
    service.view({
      name: viewName,
      properties: {
        ...identifiers,
        ...App.rangeProperties,
      },
      internal: !external,
      access: external && (config.listAccess || config.readAccess),
      accessControl,
      daoPath(params, { client, context }) {
        const owner = []
        for (const key of combination) owner.push(params[otherPropertyNames[key]])
        return modelRuntime().sortedIndexRangePath(indexName, owner, App.extractRange(params) )
      }
    })
  }
  const propsByType = {}
  for(let i = 0; i < otherPropertyNames.length; i++) {
    const prop = otherPropertyNames[i]
    const type = others[i]
    if(!propsByType[type]) propsByType[type] = []
    propsByType[type].push(prop)
  }
  const multiPropsTypes = Object.keys(propsByType).filter(type => propsByType[type].length > 1)
  const typeCombinations = allCombinations(multiPropsTypes)
  for(const typeCombination of typeCombinations) {
    const typeNames = typeCombination.map(t => {
      const type = t.split('_')[1]
      return type[0].toUpperCase() + type.slice(1)
    })
    const parametersNames = typeCombination
      .map(t => t.split('_').pop())
      .map(t => t[0].toLowerCase() + t.slice(1))
    const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, parametersNames, typeCombination)
    const indexName = 'ownedBy'+typeNames.join('And')
    const viewName = typeNames.join('And') + context.partialReverseRelationWord + pluralize(modelName)
    model.crud['rangeBy_'+typeCombination.join('And')] = viewName
    //console.log("DEFINE TYPE RANGE VIEW", viewName, typeCombination)
    const identifiers = createIdentifiersProperties(parametersNames, typeCombination)
    service.view({
      name: viewName,
      properties: {
        ...identifiers,
        ...App.rangeProperties,
      },
      internal: !external,
      access: external && (config.listAccess || config.readAccess),
      accessControl,
      daoPath(params, { client, context }) {
        const owner = []
        for (const key of parametersNames) owner.push(params[key])
        return modelRuntime().sortedIndexRangePath(indexName, owner, App.extractRange(params) )
      }
    })
  }
}

export function getSetFunction( validators, validationContext, config, context) {
  const {
    service, app, model, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = modelName + 'Set'
  async function execute(properties, { client, service, trigger }, emit) {
    const idParts = extractIdParts(otherPropertyNames, properties)
    const id = idParts.length > 1 ? idParts.map(p => JSON.stringify(p)).join(':') : idParts[0]
    const identifiers = extractIdentifiers(otherPropertyNames, properties)
    const data = extractObjectData(writeableProperties, properties,
      App.computeDefaults(model, properties, { client, service, trigger } ))
    await App.validation.validate({ ...identifiers, ...data }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, identifiers, id, null, data, trigger)
    emit({
      type: eventName,
      identifiers, data
    })
  }
  return execute
}

export function defineSetAction(config, context) {
  const {
    service, app, model, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const actionName = 'set' + modelName
  model.crud.create = actionName
  const sourceAccessControl = config.setAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames, others)
  const action = new ActionDefinition({
    name: actionName,
    properties: { ...(model.properties) },
    access: config.setAccess || config.writeAccess,
    accessControl,
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(action, service, action)
  const validationContext = { source: action, action }
  action.execute = getSetFunction( validators, validationContext, config, context)
  if(service.actions[actionName]) throw new Error('Action ' + actionName + ' already defined')
  service.actions[actionName] = action
}

export function defineSetTrigger(config, context) {
  const {
    service, app, model, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const actionName = 'set' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: { ...(model.properties) },
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getSetFunction( validators, validationContext, config, context)
  if(service.triggers[triggerName]) throw new Error('Trigger ' + triggerName + ' already defined')
  service.triggers[triggerName] = [trigger]
}

export function getUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = modelName + 'Updated'
  return async function execute(properties, { client, service, trigger }, emit) {
    const identifiers = extractIdentifiers(otherPropertyNames, properties)
    const id = generateId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    if (!entity) throw new Error('not_found')
    const data = App.utils.mergeDeep({},
      extractObjectData(writeableProperties, properties, entity),
      App.computeUpdates(model, { ...entity, ...properties }, { client, service })
    )
    await App.validation.validate({ ...identifiers, ...data }, validators,
      validationContext)
    const oldData = extractObjectData(writeableProperties, entity, {})
    await fireChangeTriggers(context, objectType, identifiers, id,
      entity ? extractObjectData(writeableProperties, entity, {}) : null, data, trigger)
    emit({
      type: eventName,
      identifiers, data
    })
  }
}

export function defineUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const actionName = 'update' + modelName
  model.crud.update = actionName
  const sourceAccessControl = config.updateAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames, others)
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.updateAccess || config.writeAccess,
    accessControl,
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(action, service, action)
  const validationContext = { source: action, action }
  action.execute = getUpdateFunction( validators, validationContext, config, context)
  if(service.actions[actionName]) throw new Error('Action ' + actionName + ' already defined')
  service.actions[actionName] = action
}

export function defineUpdateTrigger(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const actionName = 'update' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      ...(model.properties)
    },
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getUpdateFunction( validators, validationContext, config, context)
  if(service.triggers[triggerName]) throw new Error('Trigger ' + triggerName + ' already defined')
  service.triggers[triggerName] = [trigger]
}

export function getSetOrUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = modelName + 'Updated'
  return async function execute(properties, { client, service, trigger }, emit) {
    const identifiers = extractIdentifiers(otherPropertyNames, properties)
    const id = generateId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    const data = App.utils.mergeDeep({},
      App.computeDefaults(model, properties, { client, service } ),
      extractObjectData(writeableProperties, properties, entity),
      App.computeUpdates(model, { ...entity, ...properties }, { client, service })
    )
    await App.validation.validate({ ...identifiers, ...data },  validators, { ...validationContext, service, app, client })
    await fireChangeTriggers(context, objectType, identifiers, id,
      entity ? extractObjectData(writeableProperties, entity, {}) : null, data, trigger)
    emit({
      type: eventName,
      identifiers, data
    })
  }
}

export function defineSetOrUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const actionName = 'setOrUpdate' + modelName
  model.crud.createOrUpdate = actionName
  const sourceAccessControl = config.updateAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames, others)
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.updateAccess || config.writeAccess,
    accessControl,
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(action, service, action)
  const validationContext = { source: action, action }
  action.execute = getSetOrUpdateFunction( validators, validationContext, config, context)
  if(service.actions[actionName]) throw new Error('Action ' + actionName + ' already defined')
  service.actions[actionName] = action
}

export function defineSetOrUpdateTrigger(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const actionName = 'setOrUpdate' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      ...(model.properties)
    },
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getSetOrUpdateFunction( validators, validationContext, config, context)
  if(service.triggers[triggerName]) throw new Error('Trigger ' + triggerName + ' already defined')
  service.triggers[triggerName] = [trigger]
}

export function getResetFunction( validators, validationContext, config, context) {
  const {
    service, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model, others, writeableProperties
  } = context
  const eventName = modelName + 'Reset'
  return async function execute(properties, { client, service, trigger }, emit) {
    const identifiers = extractIdentifiers(otherPropertyNames, properties)
    const id = properties[modelPropertyName] ?? generateId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    if (!entity) throw new Error('not_found')
    await fireChangeTriggers(context, objectType, identifiers, id,
        entity ? extractObjectData(writeableProperties, entity, {}) : null, null, trigger)
    emit({
      type: eventName,
      identifiers: {
        ...identifiers,
        [modelPropertyName]: id
      }
    })
  }
}

export function defineDeleteAction(config, context) {
  const {
    service, modelRuntime, modelPropertyName, objectType, identifiers,
    otherPropertyNames, joinedOthersPropertyName, modelName,
    joinedOthersClassName, model, others, writeableProperties
  } = context
  const actionName = 'delete' + modelName
  const sourceAccessControl = config.resetAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(
    sourceAccessControl, [modelPropertyName], [objectType]
  )
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      }
    },
    access: config.resetAccess || config.writeAccess,
    accessControl,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(action, service, action)
  const validationContext = { source: action, action }
  action.execute = getResetFunction( validators, validationContext, config, context)
  if(service.actions[actionName]) throw new Error('Action ' + actionName + ' already defined')
  service.actions[actionName] = action
}

export function defineDeleteTrigger(config, context) {
  const {
    service, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model, others, writeableProperties
  } = context
  const actionName = 'delete' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      }
    },
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getResetFunction( validators, validationContext, config, context)
  if(service.triggers[triggerName]) throw new Error('Trigger ' + triggerName + ' already defined')
  service.triggers[triggerName] = [trigger]
}


export function defineResetAction(config, context) {
  const {
    service, modelRuntime, modelPropertyName, objectType, identifiers,
    otherPropertyNames, joinedOthersPropertyName, modelName,
    joinedOthersClassName, model, others, writeableProperties
  } = context
  const actionName = 'reset' + modelName
  model.crud.delete = actionName
  const properties = {}
  for (let i = 0; i < others.length; i++) {
    properties[otherPropertyNames[i]] = new PropertyDefinition({
      type: others[i],
      validation: ['nonEmpty']
    })
  }
  const sourceAccessControl = config.resetAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(
    sourceAccessControl, [modelPropertyName], [objectType]
  )
  const action = new ActionDefinition({
    name: actionName,
    properties,
    access: config.resetAccess || config.writeAccess,
    accessControl,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(action, service, action)
  const validationContext = { source: action, action }
  action.execute = getResetFunction( validators, validationContext, config, context)
  if(service.actions[actionName]) throw new Error('Action ' + actionName + ' already defined')
  service.actions[actionName] = action
}

export function defineResetTrigger(config, context) {
  const {
    service, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model,
    others, writeableProperties
  } = context
  const actionName = 'reset' + modelName
  const properties = {}
  for (let i = 0; i < others.length; i++) {
    properties[otherPropertyNames[i]] = new PropertyDefinition({
      type: others[i],
      validation: ['nonEmpty']
    })
  }
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getResetFunction( validators, validationContext, config, context)
  if(service.triggers[triggerName]) throw new Error('Trigger ' + triggerName + ' already defined')
  service.triggers[triggerName] = [trigger]
}
