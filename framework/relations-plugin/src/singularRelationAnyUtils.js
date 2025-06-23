import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, TriggerDefinition
} from '@live-change/framework'
import {
  extractTypeAndIdParts, extractIdentifiersWithTypes, generateAnyId,
  prepareAccessControl, cloneAndPrepareAccessControl
} from './utilsAny.js'
import {
  extractObjectData,
  cloneAndPrepareAccessControl as cloneAndPrepareSingleAccessControl
} from './utils.js'
import { allCombinations } from "./combinations.js"
import { fireChangeTriggers } from "./changeTriggers.js"

import pluralize from 'pluralize'

export function createIdentifiersProperties(keys) {
  const identifiers = {}
  if(keys) for(const key of keys) {
    identifiers[key + 'Type'] = {
      type: String,
      validation: ['nonEmpty']
    }
    identifiers[key] = {
      type: String,
      validation: ['nonEmpty']
    }
  }
  return identifiers
}

function defineObjectView(config, context, external = true) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model } = context
  const viewProperties = createIdentifiersProperties(otherPropertyNames)
  const sourceAccessControl = external
    && (config.singleAccessControl || config.readAccessControl || config.writeAccessControl)
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames)
  const viewName = config.name
    || ((config.prefix ? config.prefix + modelName : modelName[0].toLowerCase() + modelName.slice(1)) + (config.suffix || ''))
  model.crud.read = viewName
  service.view({
    name: viewName,
    properties: {
      ...viewProperties
    },
    returns: {
      type: model,
    },
    internal: !external,
    access: external && (config.singleAccess || config.readAccess),
    global: config.globalView,
    accessControl,
    daoPath(properties, { client, context }) {
      const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)
      const id = typeAndIdParts.length > 1 ? typeAndIdParts.map(p => JSON.stringify(p)).join(':') : idParts[0]
      const path = config.fields ? modelRuntime().limitedPath(id, config.fields) : modelRuntime().path(id)
      return path
    }
  })
}

function defineRangeViews(config, context, external = true) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model } = context
  const identifierCombinations = allCombinations(otherPropertyNames).slice(0, -1)
  const sourceAccessControl = external
    && (config.listAccessControl || config.readAccessControl || config.writeAccessControl)
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames)
  for(const combination of identifierCombinations) {
    const propsUpperCase = combination.map(prop => prop[0].toUpperCase() + prop.slice(1))
    const indexName = 'by' + combination.map(prop => prop[0].toUpperCase() + prop.slice(1))
    const joinedCombinationName = combination[0][0].toLowerCase() + combination[0].slice(1) +
        propsUpperCase.slice(1).join('And')        
    const viewName = joinedCombinationName + context.partialReverseRelationWord + pluralize(modelName)   
    const identifiers = createIdentifiersProperties(combination)
    model.crud['rangeBy' + joinedOthersClassName[0].toUpperCase() + joinedOthersClassName.slice(1)] = viewName
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
        for (const key of combination) {
          owner.push(params[key + 'Type'], params[key])
        }
        return modelRuntime().sortedIndexRangePath(indexName, owner, App.extractRange(params) )
      }
    })
  }
}

function getSetFunction( validators, validationContext, config, context) {
  const {
    service, app, model, objectType, modelRuntime,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = modelName + 'Set'
  return async function execute(properties, { client, service, trigger }, emit) {
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const id = generateAnyId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    const data = extractObjectData(writeableProperties, properties,
      App.computeDefaults(model, properties, { client, service } ))
    await App.validation.validate({ ...identifiers, ...data }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, identifiers, id, null, data, trigger)
    emit({
      type: eventName,
      identifiers, data
    })
    return id
  }
}

function defineSetAction(config, context) {
  const {
    service, app, model, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'set' + modelName
  model.crud.create = actionName
  const sourceAccessControl = config.setAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames)
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

function defineSetTrigger(config, context) {
  const {
    service, app, model, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
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

function getUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = modelName + 'Updated'
  return async function execute(properties, { client, service, trigger }, emit) {
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const id = generateAnyId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    if (!entity) throw new Error('not_found')
    const data = App.utils.mergeDeep({},
      extractObjectData(writeableProperties, properties, entity),
      App.computeUpdates(model, { ...entity, ...properties }, { client, service })
    )
    await App.validation.validate({ ...identifiers, ...data }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, identifiers, id,
      entity ? extractObjectData(writeableProperties, entity, {}) : null, data, trigger)
    emit({
      type: eventName,
      identifiers, data
    })
    return id
  }
}

function defineUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'update' + modelName
  model.crud.update = actionName
  const sourceAccessControl = config.updateAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames)
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      ...propertiesWithoutDefaults(model.properties)
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

function defineUpdateTrigger(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'update' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      ...propertiesWithoutDefaults(model.properties)
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

function getSetOrUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = modelName + 'Updated'
  return async function execute(properties, { client, service, trigger }, emit) {
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const id = generateAnyId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    const data = App.utils.mergeDeep({},
      App.computeDefaults(model, properties, { client, service } ),
      extractObjectData(writeableProperties, properties, entity),
      App.computeUpdates(model, { ...entity, ...properties }, { client, service })
    )
    await App.validation.validate({ ...identifiers, ...data }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, identifiers, id,
      entity ? extractObjectData(writeableProperties, entity, {}) : null, data, trigger)
    emit({
      type: eventName,
      identifiers, data
    })
    return id
  }
}

function defineSetOrUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'setOrUpdate' + modelName
  model.crud.createOrUpdate = actionName
  const sourceAccessControl = config.setOrUpdateAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames)
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      ...propertiesWithoutDefaults(model.properties)
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

function defineSetOrUpdateTrigger(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'setOrUpdate' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      ...propertiesWithoutDefaults(model.properties)
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

function getResetFunction(config, context) {
  const {
    service, app, model, modelRuntime, objectType, modelPropertyName,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = modelName + 'Reset'
  return async function execute(properties, { client, service, trigger }, emit) {
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const id = properties[modelPropertyName] ?? generateAnyId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    if (!entity) throw new Error('not_found')
    await fireChangeTriggers(context, objectType, identifiers, id,
        entity ? extractObjectData(writeableProperties, entity, {}) : null, null, trigger)
    emit({
      type: eventName,
      identifiers
    })
    return id
  }
}

function defineResetAction(config, context) {
  const {
    service, modelRuntime, modelPropertyName, identifiers, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model
  } = context
  const actionName = 'reset' + modelName
  const sourceAccessControl = config.resetAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames)
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      ...identifiers
    },
    access: config.resetAccess || config.writeAccess,
    accessControl,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: getResetFunction(config, context)
  })
}

function defineResetTrigger(config, context) {
  const {
    service, modelRuntime, modelPropertyName, identifiers, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model
  } = context
  const actionName = 'reset' + modelName
  model.crud.reset = actionName
  const triggerName = `${service.name}_${actionName}`
  service.triggers[triggerName] = [new TriggerDefinition({
    name: triggerName,
    properties: {
      ...identifiers
    },
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: getResetFunction(config, context)
  })]
}

function defineDeleteAction(config, context) {
  const {
    service, modelRuntime, modelPropertyName, identifiers, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model
  } = context
  const actionName = 'delete' + modelName
  model.crud.delete = actionName
  const sourceAccessControl = config.resetAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(
    sourceAccessControl, [modelPropertyName], [objectType]
  )
  service.actions[actionName] = new ActionDefinition({
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
    execute: getResetFunction(config, context)
  })
}

function defineDeleteTrigger(config, context) {
  const {
    service, modelRuntime, modelPropertyName, identifiers, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model
  } = context
  const actionName = 'delete' + modelName
  const triggerName = `${service.name}_${actionName}`
  service.triggers[triggerName] = [new TriggerDefinition({
    name: triggerName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      }
    },
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: getResetFunction(config, context)
  })]
}

export {
  defineObjectView, defineRangeViews,
  defineSetAction, defineUpdateAction, defineSetOrUpdateAction, defineResetAction, defineDeleteAction,
  defineSetTrigger, defineUpdateTrigger, defineSetOrUpdateTrigger, defineResetTrigger, defineDeleteTrigger
}
