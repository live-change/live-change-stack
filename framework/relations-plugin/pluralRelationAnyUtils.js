import App from "@live-change/framework"
const { extractRange } = App
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, TriggerDefinition
} from "@live-change/framework"
import { extractTypeAndIdParts, extractIdentifiersWithTypes, prepareAccessControl } from "./utilsAny.js"
import { extractObjectData, extractIdentifiers, extractIdParts } from './utils.js'
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
  const accessControl = external && (config.readAccessControl || config.writeAccessControl)
  prepareAccessControl(accessControl, otherPropertyNames)
  const viewName = joinedOthersPropertyName + context.reverseRelationWord + pluralize(modelName)
  model.crud.range = viewName
  service.views[viewName] = new ViewDefinition({
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
    modelName, others, model, modelPropertyName } = context
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
  viewProperties[modelPropertyName] = new PropertyDefinition({
    type: model,
    validation: ['nonEmpty']
  })
  const accessControl = external && (config.readAccessControl || config.writeAccessControl)
  prepareAccessControl(accessControl, otherPropertyNames)
  const viewName = joinedOthersPropertyName + context.reverseRelationWord + modelName
  model.crud.read = viewName
  service.views[viewName] = new ViewDefinition({
    name: viewName,
    properties: {
      ...viewProperties
    },
    returns: {
      type: model
    },
    internal: !external,
    access: external && (config.readAccess || config.writeAccess),
    accessControl,
    async daoPath(properties, { client, context }) {
      const idParts = extractTypeAndIdParts(otherPropertyNames, properties)
      const prefix = App.encodeIdentifier(idParts)
      const range = {
        gte: prefix+'_'+properties[modelPropertyName],
        lte: prefix+'_'+properties[modelPropertyName]
      }
      const path = modelRuntime().indexObjectPath(indexName, idParts, range)
      return path
    }
  })
}

function getCreateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Created'
  return async function execute(properties, { client, service }, emit) {
    const id = properties[modelPropertyName] || app.generateUid()
    const entity = await modelRuntime().get(id)
    if(entity) throw 'exists'
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const data = extractObjectData(writeableProperties, properties,
      App.computeDefaults(model, properties, { client, service } ))
    await App.validation.validate({ ...identifiers, ...data }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, identifiers, id, null, data)
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
  const actionName = 'create' + joinedOthersClassName + context.reverseRelationWord + modelName
  model.crud.create = actionName
  const accessControl = config.createAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
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
  service.actions[actionName] = action
}

function defineCreateTrigger(config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'create' + joinedOthersClassName + context.reverseRelationWord + modelName
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
  service.triggers[triggerName] = [trigger]
}

function getUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Updated'
  return async function execute(properties, { client, service }, emit) {
    const id = properties[modelPropertyName]
    if(!id) throw new Error('no_id')
    const entity = await modelRuntime().get(id)
    if(!entity) throw 'not_found'
    const entityTypeAndIdParts = extractTypeAndIdParts(otherPropertyNames, entity)
    const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)
    console.log("UPDATE MATCH", entityTypeAndIdParts, '===', typeAndIdParts,
      '=>', JSON.stringify(entityTypeAndIdParts) === JSON.stringify(typeAndIdParts))
    if(JSON.stringify(entityTypeAndIdParts) !== JSON.stringify(typeAndIdParts)) {
      throw 'not_authorized'
    }
    const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
    const data = App.utils.mergeDeep({},
      extractObjectData(writeableProperties, properties, entity),
      App.computeUpdates(model, { ...entity, ...properties }, { client, service })
    )
    await App.validation.validate({ ...identifiers, ...data, [modelPropertyName]: id }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, identifiers, id,
      extractObjectData(writeableProperties, entity, {}), data)
    emit({
      type: eventName,
      [modelPropertyName]: id,
      identifiers,
      data
    })
  }
}

function defineUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'update' + joinedOthersClassName + context.reverseRelationWord + modelName
  model.crud.update = actionName
  const accessControl = config.updateAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      },
      ...(model.properties)
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
  service.actions[actionName] = action
}

function defineUpdateTrigger(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'update' + joinedOthersClassName + context.reverseRelationWord + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      },
      ...(model.properties)
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
  service.triggers[triggerName] = [trigger]
}

function getDeleteFunction(config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Deleted'
  return async function execute(properties, { client, service }, emit) {
    const id = properties[modelPropertyName]
    const entity = await modelRuntime().get(id)
    if(!entity) throw 'not_found'
    const entityTypeAndIdParts = extractTypeAndIdParts(otherPropertyNames, entity)
    const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)
    if(JSON.stringify(entityTypeAndIdParts) !== JSON.stringify(typeAndIdParts)) {
      throw 'not_authorized'
    }
    await fireChangeTriggers(context, objectType, extractIdentifiers(otherPropertyNames, entity), id,
      extractObjectData(writeableProperties, entity, {}), null)
    emit({
      type: eventName,
      [modelPropertyName]: id
    })
  }
}

function defineDeleteAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, identifiers, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'delete' + joinedOthersClassName + context.reverseRelationWord + modelName
  model.crud.delete = actionName
  const accessControl = config.deleteAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
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
  service.actions[actionName] = action
}

function defineDeleteTrigger(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, identifiers, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const actionName = 'delete' + joinedOthersClassName + context.reverseRelationWord + modelName
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
