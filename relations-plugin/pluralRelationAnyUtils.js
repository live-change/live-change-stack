const App = require("@live-change/framework")
const { PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition } = App
const { extractTypeAndIdParts, extractIdentifiersWithTypes } = require("./utilsAny.js")
const { extractObjectData } = require("./utils.js")
const { extractRange } = App

const pluralize = require('pluralize')

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
    access: config.readAccess,
    accessControl: config.readAccessControl || config.writeAccessControl,
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
    service, app, model,  defaults, modelPropertyName, modelRuntime,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Created'
  const actionName = 'create' + joinedOthersClassName + context.reverseRelationWord + modelName
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.createAccess || config.writeAccess,
    accessControl: config.createAccessControl || config.writeAccessControl,
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
      emit({
        type: eventName,
        [modelPropertyName]: id,
        identifiers, data
      })
    }
  })
  const action = service.actions[actionName]
  const validators = App.validation.getValidators(action, service, action)
}

function defineUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Updated'
  const actionName = 'update' + joinedOthersClassName + context.reverseRelationWord + modelName
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
    accessControl: config.updateAccessControl || config.writeAccessControl,
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
    service, app, model, modelRuntime, modelPropertyName, identifiers,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Deleted'
  const actionName = 'delete' + joinedOthersClassName + context.reverseRelationWord + modelName
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
    accessControl: config.deleteAccessControl || config.writeAccessControl,
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    async execute(properties, { client, service }, emit) {
      const id = properties[modelPropertyName]
      const entity = await modelRuntime().get(id)
      if(!entity) throw new Error('not_found')
      const entityTypeAndIdParts = extractTypeAndIdParts(otherPropertyNames, entity)
      const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)
      if(JSON.stringify(entityTypeAndIdParts) != JSON.stringify(typeAndIdParts)) {
        throw new Error('not_authorized')
      }
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

module.exports = { defineView, defineCreateAction, defineUpdateAction, defineDeleteAction, defineSortIndex }
