import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, TriggerDefinition
} from '@live-change/framework'
import {
  extractTypeAndIdParts, extractIdentifiersWithTypes, generateAnyId, prepareAccessControl
} from './utilsAny.js'
import { extractObjectData } from "./utils.js"
import { allCombinations } from "./combinations.js"
import { fireChangeTriggers } from "./changeTriggers.js"

import pluralize from 'pluralize'

function createIdentifiersProperties(keys) {
  const identifiers = {}
  if(keys) for(const key of keys) {
    identifiers[key] = {
      type: String,
      validation: ['nonEmpty']
    }
    identifiers[key + 'Type'] = {
      type: String,
      validation: ['nonEmpty']
    }
  }
  return identifiers
}

function defineObjectView(config, context, external = true) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model } = context
  const viewProperties = {}
  for (let i = 0; i < others.length; i++) {
    viewProperties[otherPropertyNames[i]] = new PropertyDefinition({
      type: 'String',
      validation: ['nonEmpty']
    })
    viewProperties[otherPropertyNames[i] + 'Type'] = new PropertyDefinition({
      type: 'String',
      validation: ['nonEmpty']
    })
  }
  const accessControl = external
    && (config.singleAccessControl || config.readAccessControl || config.writeAccessControl)
  prepareAccessControl(accessControl, otherPropertyNames)
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
  const accessControl = external && (config.listAccessControl || config.readAccessControl || config.writeAccessControl)
  prepareAccessControl(accessControl, otherPropertyNames)
  for(const combination of identifierCombinations) {
    const propsUpperCase = combination.map(prop => prop[0].toUpperCase() + prop.slice(1))
    const indexName = 'by' + combination.map(prop => prop[0].toUpperCase() + prop.slice(1))
    const viewName = combination[0][0].toLowerCase() + combination[0].slice(1) +
        propsUpperCase.slice(1).join('And') + context.partialReverseRelationWord + pluralize(modelName)
    console.log("DEFINE RANGE VIEW", viewName, combination)
    const identifiers = createIdentifiersProperties(combination)
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
  return async function execute(properties, { client, service }, emit) {
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const id = generateAnyId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    const data = extractObjectData(writeableProperties, properties,
      App.computeDefaults(model, properties, { client, service } ))
    await App.validation.validate({ ...identifiers, ...data }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, identifiers, id, null, data)
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
  const accessControl = config.setAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
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
  return async function execute(properties, {client, service}, emit) {
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
      entity ? extractObjectData(writeableProperties, entity, {}) : null, data)
    emit({
      type: eventName,
      identifiers, data
    })
  }
}

function defineUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'update' + modelName
  model.crud.update = actionName
  const accessControl = config.updateAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
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

function getSetOrUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = modelName + 'Updated'
  return async function execute(properties, { client, service }, emit) {
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
      entity ? extractObjectData(writeableProperties, entity, {}) : null, data)
    emit({
      type: eventName,
      identifiers, data
    })
  }
}

function defineSetOrUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = modelName + 'Updated'
  const actionName = 'setOrUpdate' + modelName
  model.crud.createOrUpdate = actionName
  const accessControl = config.setOrUpdateAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
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

function getResetFunction(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Reset'
  return async function execute(properties, {client, service}, emit) {
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const id = generateAnyId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    if (!entity) throw new Error('not_found')
    await fireChangeTriggers(context, objectType, identifiers, id,
        entity ? extractObjectData(writeableProperties, entity, {}) : null, null)
    emit({
      type: eventName,
      identifiers
    })
  }
}

function defineResetAction(config, context) {
  const {
    service, modelRuntime, modelPropertyName, identifiers, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model
  } = context
  const actionName = 'reset' + modelName
  model.crud.delete = actionName
  const accessControl = config.resetAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
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

export {
  defineObjectView, defineRangeViews,
  defineSetAction, defineUpdateAction, defineSetOrUpdateAction, defineResetAction,
  defineSetTrigger, defineUpdateTrigger, defineSetOrUpdateTrigger, defineResetTrigger
}
