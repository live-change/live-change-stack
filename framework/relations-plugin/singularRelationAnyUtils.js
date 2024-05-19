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
  const viewName = config.name || ((config.prefix ? (config.prefix + joinedOthersClassName) : joinedOthersPropertyName) +
      context.reverseRelationWord + modelName + (config.suffix || ''))
  service.views[viewName] = new ViewDefinition({
    name: viewName,
    properties: {
      ...viewProperties
    },
    returns: {
      type: model,
    },
    internal: !external,
    access: external && (config.singleAccess || config.readAccess),
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
    service.views[viewName] = new ViewDefinition({
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

function getSetFunction(validators, config, context) {
  const {
    service, app, model, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Set'
  return async function execute(properties, { client, service }, emit) {
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const data = extractObjectData(writeableProperties, properties,
      App.computeDefaults(model, properties, { client, service } ))
    await App.validation.validate({ ...identifiers, ...data }, validators,
      { source: action, action, service, app, client })
    await fireChangeTriggers(context, objectType, identifiers, id, null, data)
    emit({
      type: eventName,
      identifiers, data
    })
  }
}

function defineSetAction(config, context) {
  const {
    service, app, model, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'set' + joinedOthersClassName + context.reverseRelationWord + modelName
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
  action.execute = getSetFunction(validators, config, context)
  service.actions[actionName] = action
}

function defineSetTrigger(config, context) {
  const {
    service, app, model, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'set' + joinedOthersClassName + context.reverseRelationWord + modelName
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
  trigger.execute = getSetFunction(validators, config, context)
  service.triggers[triggerName] = [trigger]
}

function getUpdateFunction(validators, config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Updated'
  return async function execute(properties, {client, service}, emit) {
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const id = generateAnyId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    if (!entity) throw new Error('not_found')
    const data = extractObjectData(writeableProperties, properties, entity)
    await App.validation.validate({ ...identifiers, ...data }, validators,
      { source: action, action, service, app, client })
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
  const actionName = 'update' + joinedOthersClassName + context.reverseRelationWord + modelName
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
  action.execute = getUpdateFunction(validators, config, context)
  service.actions[actionName] = action
}

function defineUpdateTrigger(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'update' + joinedOthersClassName + context.reverseRelationWord + modelName
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
  trigger.execute = getUpdateFunction(validators, config, context)
  service.triggers[triggerName] = [trigger]
}

function getSetOrUpdateFunction(validators, config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Updated'
  return async function execute(properties, { client, service }, emit) {
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const id = generateAnyId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    const data = extractObjectData(writeableProperties, properties, {
      ...App.computeDefaults(model, properties, { client, service } ),
      ...entity
    })
    await App.validation.validate({ ...identifiers, ...data }, validators,
      { source: action, action, service, app, client })
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
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Updated'
  const actionName = 'setOrUpdate' + joinedOthersClassName + context.reverseRelationWord + modelName
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
  action.execute = getSetOrUpdateFunction(validators, config, context)
  service.actions[actionName] = action
}

function defineSetOrUpdateTrigger(config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'setOrUpdate' + joinedOthersClassName + context.reverseRelationWord + modelName
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
  trigger.execute = getSetOrUpdateFunction(validators, config, context)
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
  const actionName = 'reset' + joinedOthersClassName + context.reverseRelationWord + modelName
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
  const actionName = 'reset' + joinedOthersClassName + context.reverseRelationWord + modelName
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
