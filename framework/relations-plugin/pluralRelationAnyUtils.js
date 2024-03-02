import App from "@live-change/framework"
const { extractRange } = App
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
} from "@live-change/framework"
import { extractTypeAndIdParts, extractIdentifiersWithTypes, prepareAccessControl } from "./utilsAny.js"
import { extractObjectData, extractIdentifiers} from "./utils.js"
import { fireChangeTriggers } from "./changeTriggers.js"

import pluralize from 'pluralize'

function defineView(config, context) {
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
  const accessControl = config.readAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
  const viewName = joinedOthersPropertyName + context.reverseRelationWord + pluralize(modelName)
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
    access: config.readAccess || config.writeAccess,
    accessControl,
    daoPath(properties, { client, context }) {
      const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)
      const range = extractRange(properties)
      const path = modelRuntime().sortedIndexRangePath(indexName, typeAndIdParts, range)
      return path
    }
  })
}

function defineCreateAction(config, context) {
  const {
    service, app, model,  defaults, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Created'
  const actionName = 'create' + joinedOthersClassName + context.reverseRelationWord + modelName
  const accessControl = config.createAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.createAccess || config.writeAccess,
    accessControl,
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    async execute(properties, { client, service }, emit) {
      const id = properties[modelPropertyName] || app.generateUid()
      const entity = await modelRuntime().get(id)
      if(entity) throw 'exists'
      const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
      const data = extractObjectData(writeableProperties, properties, defaults)
      await App.validation.validate({ ...identifiers, ...data }, validators,
          { source: action, action, service, app, client })
      await fireChangeTriggers(context, objectType, identifiers, id, null, data)
      emit({
        type: eventName,
        [modelPropertyName]: id,
        identifiers, data
      })
      return id
    }
  })
  const action = service.actions[actionName]
  const validators = App.validation.getValidators(action, service, action)
}

function defineUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Updated'
  const actionName = 'update' + joinedOthersClassName + context.reverseRelationWord + modelName
  const accessControl = config.updateAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
  service.actions[actionName] = new ActionDefinition({
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
    async execute(properties, { client, service }, emit) {
      const id = properties[modelPropertyName]
      if(!id) throw 'no_id'
      const entity = await modelRuntime().get(id)
      if(!entity) throw 'not_found'
      const entityTypeAndIdParts = extractTypeAndIdParts(otherPropertyNames, entity)
      const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)
      if(JSON.stringify(entityTypeAndIdParts) != JSON.stringify(typeAndIdParts)) {
        throw 'not_authorized'
      }
      const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
      const data = extractObjectData(writeableProperties, properties, entity)
      await App.validation.validate({ ...identifiers, ...data }, validators,
          { source: action, action, service, app, client })
      await fireChangeTriggers(context, objectType, identifiers, id,
          extractObjectData(writeableProperties, entity, {}), data)
      emit({
        type: eventName,
        [modelPropertyName]: id,
        identifiers,
        data
      })
    }
  })
  const action = service.actions[actionName]
  const validators = App.validation.getValidators(action, service, action)
}

function defineDeleteAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, identifiers, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Deleted'
  const actionName = 'delete' + joinedOthersClassName + context.reverseRelationWord + modelName
  const accessControl = config.deleteAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames)
  service.actions[actionName] = new ActionDefinition({
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
    async execute(properties, { client, service }, emit) {
      const id = properties[modelPropertyName]
      const entity = await modelRuntime().get(id)
      if(!entity) throw new Error('not_found')
      const entityTypeAndIdParts = extractTypeAndIdParts(otherPropertyNames, entity)
      const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)
      const identifiers = extractIdentifiers(otherPropertyNames, entity)
      if(JSON.stringify(entityTypeAndIdParts) != JSON.stringify(typeAndIdParts)) {
        throw new Error('not_authorized')
      }
      await fireChangeTriggers(context, objectType, identifiers, id,
          extractObjectData(writeableProperties, entity, {}), null)
      emit({
        type: eventName,
        [modelPropertyName]: id
      })
    }
  })
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

export { defineView, defineCreateAction, defineUpdateAction, defineDeleteAction, defineSortIndex }
