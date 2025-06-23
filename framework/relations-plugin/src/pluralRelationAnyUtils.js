import App from "@live-change/framework"
const { extractRange } = App
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, TriggerDefinition
} from "@live-change/framework"
import {
  extractTypeAndIdParts,
  extractIdentifiersWithTypes,
  prepareAccessControl,
  cloneAndPrepareAccessControl
} from './utilsAny.js'
import {
  extractObjectData, extractIdentifiers, extractIdParts,
  cloneAndPrepareAccessControl as cloneAndPrepareSingleAccessControl,
  propertiesWithoutDefaults
} from './utils.js'
import { fireChangeTriggers } from "./changeTriggers.js"

import pluralize from 'pluralize'

function defineRangeView(config, context, external = true) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model } = context
  const indexName = 'by'+context.joinedOthersClassName
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
  const sourceAccessControl = external && (config.readAccessControl || config.writeAccessControl)
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames)
  const viewName = joinedOthersPropertyName + context.reverseRelationWord + pluralize(modelName)
  model.crud['rangeBy' + joinedOthersClassName] = viewName
  service.view({
    name: viewName,
    properties: {
      ...viewProperties,
      ...App.utils.rangeProperties
    },
    returns: {
      type: Array,
      of: {
        type: model
      }
    },
    internal: !external,
    global: config.globalView,
    access: external && (config.readAccess || config.writeAccess),
    accessControl,
    daoPath(properties, { client, context }) {
      const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)
      const range = extractRange(properties)
      const path = modelRuntime().sortedIndexRangePath(indexName, typeAndIdParts, range)
      return path
    }
  })
}

function defineSingleView(config, context, external = true) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model, modelPropertyName, objectType } = context
  const viewProperties = {}
  viewProperties[modelPropertyName] = new PropertyDefinition({
    type: model,
    validation: ['nonEmpty']
  })
  const sourceAccessControl = external && (config.readAccessControl || config.writeAccessControl)
  const accessControl = cloneAndPrepareSingleAccessControl(
    sourceAccessControl, [modelPropertyName], [objectType]
  )
  const viewName = modelName[0].toLowerCase() + modelName.slice(1)
  model.crud.read = viewName
  service.view({
    name: viewName,
    properties: {
      ...viewProperties
    },
    returns: {
      type: model
    },
    internal: !external,
    global: config.globalView,
    access: external && (config.readAccess || config.writeAccess),
    accessControl,
    async daoPath(properties, { client, context }) {
      return modelRuntime().path(properties[modelPropertyName])
    }
  })
}

function getCreateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = modelName + 'Created'
  return async function execute(properties, { client, service, trigger }, emit) {
    const id = properties[modelPropertyName] || app.generateUid()
    const entity = await modelRuntime().get(id)
    if(entity) throw 'exists'
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const data = extractObjectData(writeableProperties, properties,
      App.computeDefaults(model, properties, { client, service } ))
    const result = await App.validation.validate({ ...identifiers, ...data }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, identifiers, id, null, data, trigger)
    emit({
      type: eventName,
      [modelPropertyName]: id,
      identifiers, data
    })
    return id
  }
}

function defineCreateAction(config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'create' + modelName
  model.crud.create = actionName
  const sourceAccessControl = config.createAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames)
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.createAccess || config.writeAccess,
    accessControl,
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(action, service, action)
  const validationContext = { source: action, action }
  action.execute = getCreateFunction( validators, validationContext, config, context)
  if(service.actions[actionName]) throw new Error('Action ' + actionName + ' already defined')
  service.actions[actionName] = action
}

function defineCreateTrigger(config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'create' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      ...(model.properties)
    },
    access: config.createAccess || config.writeAccess,
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getCreateFunction( validators, validationContext, config, context)
  if(service.triggers[triggerName]) throw new Error('Trigger ' + triggerName + ' already defined')
  service.triggers[triggerName] = [trigger]
}

function getUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = modelName + 'Updated'
  return async function execute(properties, { client, service, trigger }, emit) {
    const id = properties[modelPropertyName]
    if(!id) throw new Error('no_id')
    const entity = await modelRuntime().get(id)
    if(!entity) throw 'not_found'
    const entityTypeAndIdParts = extractTypeAndIdParts(otherPropertyNames, entity)
    const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)    
    /* console.log("UPDATE MATCH", entityTypeAndIdParts, '===', typeAndIdParts,
      '=>', JSON.stringify(entityTypeAndIdParts) === JSON.stringify(typeAndIdParts)) */
    if(JSON.stringify(entityTypeAndIdParts) !== JSON.stringify(typeAndIdParts)) {
      throw 'not_authorized'
    }
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const data = App.utils.mergeDeep({},
      extractObjectData(writeableProperties, properties, entity),
      App.computeUpdates(model, { ...entity, ...properties }, { client, service })
    )
    if(entityTypeAndIdParts[0] == 'task_Task' && data.retries.length == 0 && entity.retries.length > 0)  {
      console.log("TASK UPDATE!!!!!!!!")
      console.log("CURRENT STATE:", entity)
      console.log("UPDATE:", properties)
      console.log("IDENTIFIERS:", identifiers)
      console.log("EXTRACTED ENTITY DATA:", extractObjectData(writeableProperties, properties, entity))
      console.log("COMPUTED UPDATES:", App.computeUpdates(model, { ...entity, ...properties }, { client, service }))
      console.log("DATA:", data)
      debugger
    }
    await App.validation.validate({ ...identifiers, ...data, [modelPropertyName]: id }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, identifiers, id,
      extractObjectData(writeableProperties, entity, {}), data, trigger)
    emit({
      type: eventName,
      [modelPropertyName]: id,
      identifiers,
      data
    })
    return id
  }
}

function defineUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'update' + modelName
  model.crud.update = actionName
  const sourceAccessControl = config.updateAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareSingleAccessControl(
    sourceAccessControl, [modelPropertyName], [objectType]
  )
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      },
      ...propertiesWithoutDefaults(model.properties)
    },
    access: config.updateAccess || config.writeAccess,
    accessControl,
    skipValidation: true,
    //queuedBy: otherPropertyNames,
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
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'update' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      },
      ...propertiesWithoutDefaults(model.properties)
    },
    access: config.updateAccess || config.writeAccess,
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getUpdateFunction( validators, validationContext, config, context)
  if(service.triggers[triggerName]) throw new Error('Trigger ' + triggerName + ' already defined')
  service.triggers[triggerName] = [trigger]
}

function getDeleteFunction(config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = modelName + 'Deleted'
  return async function execute(properties, { client, service, trigger }, emit) {
    const id = properties[modelPropertyName]
    const entity = await modelRuntime().get(id)
    if(!entity) throw 'not_found'
    const entityTypeAndIdParts = extractTypeAndIdParts(otherPropertyNames, entity)
    const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)
    if(JSON.stringify(entityTypeAndIdParts) !== JSON.stringify(typeAndIdParts)) {
      throw 'not_authorized'
    }
    await fireChangeTriggers(context, objectType, extractIdentifiers(otherPropertyNames, entity), id,
      extractObjectData(writeableProperties, entity, {}), null, trigger)
    emit({
      type: eventName,
      [modelPropertyName]: id
    })
    return id
  }
}

function defineDeleteAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, identifiers, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'delete' + modelName
  model.crud.delete = actionName
  const sourceAccessControl = config.deleteAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareSingleAccessControl(
    sourceAccessControl, [modelPropertyName], [objectType]
  )
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      },
      ...identifiers
    },
    access: config.deleteAccess || config.writeAccess,
    accessControl,
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  action.execute = getDeleteFunction(config, context)
  if(service.actions[actionName]) throw new Error('Action ' + actionName + ' already defined')
  service.actions[actionName] = action
}

function defineDeleteTrigger(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, identifiers, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'delete' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      },
      ...identifiers
    },
    access: config.deleteAccess || config.writeAccess,
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  trigger.execute = getDeleteFunction(config, context)
  if(service.triggers[triggerName]) throw new Error('Trigger ' + triggerName + ' already defined')
  service.triggers[triggerName] = [trigger]
}

function defineSortIndex(context, sortFields) {
  if(!Array.isArray(sortFields)) sortFields = [sortFields]
  const sortFieldsUc = sortFields.map(fd => fd.slice(0, 1).toUpperCase() + fd.slice(1))
  const indexName = 'by' + context.joinedOthersClassName + 'And' + sortFieldsUc.join('And')
  const property = [...(context.otherPropertyNames.map(prop => [prop + 'Type', prop]).flat()), ...sortFields]
  console.log("DEFINE SORT INDEX", sortFields, "NAME", indexName, "PROP", property)
  context.model.indexes[indexName] = new IndexDefinition({
    property
  })
}

export {
  defineSingleView, defineRangeView,
  defineCreateAction, defineUpdateAction, defineDeleteAction,
  defineCreateTrigger, defineUpdateTrigger, defineDeleteTrigger,
  defineSortIndex
}
