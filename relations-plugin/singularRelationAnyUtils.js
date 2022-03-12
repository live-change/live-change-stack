const App = require("@live-change/framework")
const { PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition } = App
const { extractTypeAndIdParts, extractIdentifiersWithTypes, generateAnyId } = require("./utilsAny.js")
const { extractObjectData } = require("./utils.js")


function defineView(config, context) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model } = context
  const viewProperties = {}
  for (let i = 0; i < others.length; i++) {
    viewProperties[otherPropertyNames[i]] = new PropertyDefinition({
      type: others[i],
      validation: ['nonEmpty']
    })
    viewProperties[otherPropertyNames[i] + 'Type'] = new PropertyDefinition({
      type: 'String',
      validation: ['nonEmpty']
    })
  }
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
    access: config.access,
    daoPath(properties, { client, context }) {
      const typeAndIdParts = extractTypeAndIdParts(otherPropertyNames, properties)
      const id = typeAndIdParts.length > 1 ? typeAndIdParts.map(p => JSON.stringify(p)).join(':') : idParts[0]
      const path = config.fields ? modelRuntime().limitedPath(id, config.fields) : modelRuntime().path(id)
      return path
    }
  })
}

function defineSetAction(config, context) {
  const {
    service, app, model,  defaults,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context

  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Set'
  const actionName = 'set' + joinedOthersClassName + context.reverseRelationWord + modelName
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.setAccess || config.writeAccess,
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    async execute(properties, {client, service}, emit) {
      const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
      const data = extractObjectData(writeableProperties, properties, defaults)
      await App.validation.validate(data, validators, { source: action, action, service, app, client })
      emit({
        type: eventName,
        identifiers, data
      })
    }
  })
  const action = service.actions[actionName]
  const validators = App.validation.getValidators(action, service, action)
}

function defineUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Updated'
  const actionName = 'update' + joinedOthersClassName + context.reverseRelationWord + modelName
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.updateAccess || config.writeAccess,
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    async execute(properties, {client, service}, emit) {
      const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
      const id = generateAnyId(otherPropertyNames, properties)
      const entity = await modelRuntime().get(id)
      if (!entity) throw new Error('not_found')
      const data = extractObjectData(writeableProperties, properties, entity)
      await App.validation.validate(data, validators, { source: action, action, service, app, client })
      emit({
        type: eventName,
        identifiers, data
      })
    }
  })
  const action = service.actions[actionName]
  const validators = App.validation.getValidators(action, service, action)
}

function defineResetAction(config, context) {
  const {
    service, modelRuntime, modelPropertyName,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Reset'
  const actionName = 'reset' + joinedOthersClassName + context.reverseRelationWord + modelName
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      }
    },
    access: config.resetAccess || config.writeAccess,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    async execute(properties, {client, service}, emit) {
      const identifiers = extractIdentifiersWithTypes(otherPropertyNames, properties)
      const id = generateAnyId(otherPropertyNames, properties)
      const entity = await modelRuntime().get(id)
      if (!entity) throw new Error('not_found')
      emit({
        type: eventName,
        identifiers
      })
    }
  })
}

module.exports = { defineView, defineSetAction, defineUpdateAction, defineResetAction }
