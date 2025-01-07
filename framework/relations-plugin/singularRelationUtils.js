import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, TriggerDefinition
} from "@live-change/framework"
import {
  extractIdentifiers, extractObjectData, generateId, extractIdParts, prepareAccessControl, cloneAndPrepareAccessControl
} from './utils.js'
import { fireChangeTriggers } from "./changeTriggers.js"

function defineView(config, context, external = true) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model } = context
  const viewProperties = {}
  for (let i = 0; i < others.length; i++) {
    viewProperties[otherPropertyNames[i]] = new PropertyDefinition({
      type: others[i],
      validation: ['nonEmpty']
    })
  }
  const viewName = config.name
    || ((config.prefix ? config.prefix + modelName : modelName[0].toLowerCase() + modelName.slice(1)) + (config.suffix || ''))
  model.crud.read = viewName
  const sourceAccessControl = external && (config.readAccessControl || config.writeAccessControl)
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames, others)
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
      const idParts = extractIdParts(otherPropertyNames, properties)
      const id = idParts.length > 1 ? idParts.map(p => JSON.stringify(p)).join(':') : idParts[0]
      const path = config.fields ? modelRuntime().limitedPath(id, config.fields) : modelRuntime().path(id)
      return path
    }
  })
}

function getSetFunction( validators, validationContext, config, context) {
  const {
    service, app, model, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = modelName + 'Set'
  async function execute(properties, { client, service }, emit) {
    const idParts = extractIdParts(otherPropertyNames, properties)
    const id = idParts.length > 1 ? idParts.map(p => JSON.stringify(p)).join(':') : idParts[0]
    const identifiers = extractIdentifiers(otherPropertyNames, properties)
    const data = extractObjectData(writeableProperties, properties,
      App.computeDefaults(model, properties, { client, service } ))
    await App.validation.validate({ ...identifiers, ...data }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, identifiers, id, null, data)
    emit({
      type: eventName,
      identifiers, data
    })
  }
  return execute
}

function defineSetAction(config, context) {
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

function defineSetTrigger(config, context) {
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

function getUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = modelName + 'Updated'
  return async function execute(properties, { client, service }, emit) {
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

function defineUpdateTrigger(config, context) {
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

function getSetOrUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = modelName + 'Updated'
  return async function execute(properties, { client, service }, emit) {
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

function defineSetOrUpdateTrigger(config, context) {
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

function getResetFunction( validators, validationContext, config, context) {
  const {
    service, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model, others, writeableProperties
  } = context
  const eventName = modelName + 'Reset'
  return async function execute(properties, { client, service }, emit) {
    const identifiers = extractIdentifiers(otherPropertyNames, properties)
    const id = properties[modelPropertyName] ?? generateId(otherPropertyNames, properties)
    const entity = await modelRuntime().get(id)
    if (!entity) throw new Error('not_found')
    await fireChangeTriggers(context, objectType, identifiers, id,
        entity ? extractObjectData(writeableProperties, entity, {}) : null, null)
    emit({
      type: eventName,
      identifiers: {
        ...identifiers,
        [modelPropertyName]: id
      }
    })
  }
}

function defineDeleteAction(config, context) {
  const {
    service, modelRuntime, modelPropertyName, objectType, identifiers,
    otherPropertyNames, joinedOthersPropertyName, modelName,
    joinedOthersClassName, model, others, writeableProperties
  } = context
  const actionName = 'delete' + modelName
  model.crud.delete = actionName
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

function defineDeleteTrigger(config, context) {
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


function defineResetAction(config, context) {
  const {
    service, modelRuntime, modelPropertyName, objectType, identifiers,
    otherPropertyNames, joinedOthersPropertyName, modelName,
    joinedOthersClassName, model, others, writeableProperties
  } = context
  const actionName = 'reset' + modelName
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

function defineResetTrigger(config, context) {
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



export {
  defineView,
  defineSetAction, defineUpdateAction, defineSetOrUpdateAction, defineResetAction, defineDeleteAction,
  defineSetTrigger, defineUpdateTrigger, defineSetOrUpdateTrigger, defineDeleteTrigger, defineResetTrigger
}
