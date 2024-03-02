import { PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition } from "@live-change/framework"
import {
  extractIdentifiers, extractObjectData, generateId, extractIdParts, prepareAccessControl
} from "./utils.js"
import { fireChangeTriggers } from "./changeTriggers.js"

function defineView(config, context) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model } = context
  const viewProperties = {}
  for (let i = 0; i < others.length; i++) {
    viewProperties[otherPropertyNames[i]] = new PropertyDefinition({
      type: others[i],
      validation: ['nonEmpty']
    })
  }
  const viewName = config.name || ((config.prefix ? (config.prefix + joinedOthersClassName) : joinedOthersPropertyName) +
      'Owned' + modelName + (config.suffix || ''))
  const accessControl = config.readAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames, others)
  service.views[viewName] = new ViewDefinition({
    name: viewName,
    properties: {
      ...viewProperties
    },
    returns: {
      type: model,
    },
    access: config.readAccess || config.writeAccess,
    accessControl,
    daoPath(properties, { client, context }) {
      const idParts = extractIdParts(otherPropertyNames, properties)
      const id = idParts.length > 1 ? idParts.map(p => JSON.stringify(p)).join(':') : idParts[0]
      const path = config.fields ? modelRuntime().limitedPath(id, config.fields) : modelRuntime().path(id)
      return path
    }
  })
}

function defineSetAction(config, context) {
  const {
    service, app, model, defaults, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = joinedOthersPropertyName + 'Owned' + modelName + 'Set'
  const actionName = 'set' + joinedOthersClassName + 'Owned' + modelName
  const accessControl = config.setAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames, others)
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.setAccess || config.writeAccess,
    accessControl,
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    async execute(properties, { client, service }, emit) {
      const idParts = extractIdParts(otherPropertyNames, properties)
      const id = idParts.length > 1 ? idParts.map(p => JSON.stringify(p)).join(':') : idParts[0]
      const identifiers = extractIdentifiers(otherPropertyNames, properties)
      const data = extractObjectData(writeableProperties, properties, defaults)
      await App.validation.validate({ ...identifiers, ...data }, validators,
          { source: action, action, service, app, client })
      await fireChangeTriggers(context, objectType, identifiers, id, null, data)
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
    service, app, model, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = joinedOthersPropertyName + 'Owned' + modelName + 'Updated'
  const actionName = 'update' + joinedOthersClassName + 'Owned' + modelName
  const accessControl = config.updateAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames, others)
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.updateAccess || config.writeAccess,
    accessControl,
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    async execute(properties, { client, service }, emit) {
      const identifiers = extractIdentifiers(otherPropertyNames, properties)
      const id = generateId(otherPropertyNames, properties)
      const entity = await modelRuntime().get(id)
      if (!entity) throw new Error('not_found')
      const data = extractObjectData(writeableProperties, properties, entity)
      await App.validation.validate({ ...identifiers, ...data }, validators,
          { source: action, action, service, app, client })
      const oldData = extractObjectData(writeableProperties, entity, {})
      await fireChangeTriggers(context, objectType, identifiers, id,
          entity ? extractObjectData(writeableProperties, entity, {}) : null, data)
      emit({
        type: eventName,
        identifiers, data
      })
    }
  })
  const action = service.actions[actionName]
  const validators = App.validation.getValidators(action, service, action)
}

function defineSetOrUpdateAction(config, context) {
  const {
    service, app, model, defaults, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = joinedOthersPropertyName + 'Owned' + modelName + 'Updated'
  const actionName = 'update' + joinedOthersClassName + 'Owned' + modelName
  const accessControl = config.updateAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames, others)
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.updateAccess || config.writeAccess,
    accessControl: config.updateAccessControl || config.writeAccessControl,
    skipValidation: true,
    queuedBy: otherPropertyNames,
    waitForEvents: true,
    async execute(properties, { client, service }, emit) {
      const identifiers = extractIdentifiers(otherPropertyNames, properties)
      const id = generateId(otherPropertyNames, properties)
      const entity = await modelRuntime().get(id)
      const data = extractObjectData(writeableProperties, properties, { ...defaults, ...entity })
      await App.validation.validate({ ...identifiers, ...data }, validators,
          { source: action, action, service, app, client })
      await fireChangeTriggers(context, objectType, identifiers, id,
          entity ? extractObjectData(writeableProperties, entity, {}) : null, data)
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
    service, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, joinedOthersClassName, model, others, writeableProperties
  } = context
  const eventName = joinedOthersPropertyName + 'Owned' + modelName + 'Reset'
  const actionName = 'reset' + joinedOthersClassName + 'Owned' + modelName
  const accessControl = config.resetAccessControl || config.writeAccessControl
  prepareAccessControl(accessControl, otherPropertyNames, others)
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
    async execute(properties, { client, service }, emit) {
      const identifiers = extractIdentifiers(otherPropertyNames, properties)
      const id = generateId(otherPropertyNames, properties)
      const entity = await modelRuntime().get(id)
      if (!entity) throw new Error('not_found')
      await fireChangeTriggers(context, objectType, identifiers, id,
          entity ? extractObjectData(writeableProperties, entity, {}) : null, null)
      emit({
        type: eventName,
        identifiers
      })
    }
  })
}

export { defineView, defineSetAction, defineUpdateAction, defineSetOrUpdateAction, defineResetAction }
