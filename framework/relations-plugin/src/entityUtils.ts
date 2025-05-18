import {
  defineProperties, defineIndex,
  extractIdParts, extractIdentifiers, extractObjectData, prepareAccessControl,
  includeAccessRoles, defineGlobalRangeView
} from './utils.js'
import { fireChangeTriggers } from "./changeTriggers.js"
import App, { AccessSpecification, ModelDefinitionSpecification, PropertyDefinitionSpecification, ServiceDefinition } from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition, TriggerDefinition
} from "@live-change/framework"
import pluralize from 'pluralize'

import { ServiceDefinitionSpecification } from "@live-change/framework"
import { ActionDefinitionSpecificationAC, ViewDefinitionSpecificationAC, TriggerDefinitionSpecificationAC,
         ModelDefinitionSpecificationExtended, AccessControlSettings } from "./types.js"
import { EventDefinitionSpecification } from "@live-change/framework"

export interface EntityConfig {
  readAccessControl?: AccessControlSettings
  writeAccessControl?: AccessControlSettings
  createAccessControl?: AccessControlSettings
  updateAccessControl?: AccessControlSettings
  deleteAccessControl?: AccessControlSettings

  readAllAccess?: AccessSpecification
  readAccess?: AccessSpecification
  writeAccess?: AccessSpecification
  createAccess?: AccessSpecification
  updateAccess?: AccessSpecification
  deleteAccess?: AccessSpecification

  writeableProperties?: string[]
}

export interface ModelDefinitionSpecificationWithEntity extends ModelDefinitionSpecificationExtended {
  entity: EntityConfig
  entityProcessed: boolean
}

export interface EntityContext {
  service: ServiceDefinition<ServiceDefinitionSpecification>
  modelName: string
  modelPropertyName: string
  model: ModelDefinitionSpecificationWithEntity
  originalModelProperties: Record<string, PropertyDefinitionSpecification>
  modelProperties: string[]
  writeableProperties: string[]
  objectType: string
  app: App,
  modelRuntime: any,
  annotation: 'entity'
}


export function entityAccessControl({service, modelName, modelPropertyName}, accessControl) {
  if(!accessControl) return undefined
  if(Array.isArray(accessControl)) accessControl = { roles: accessControl }
  return {
    objects: p => [{ objectType: service.name + '_' + modelName, object: p[modelPropertyName]}],
    ...accessControl
  }
}

export function defineView(config, context, external) {
  const { service, modelRuntime, modelPropertyName, modelName, model } = context
  const viewName = (config.prefix || '' ) + (config.prefix ? modelName : modelPropertyName) + (config.suffix || '')
  if(external) model.crud.read = viewName
  const view = service.view({
    name: viewName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      }
    },
    returns: {
      type: model,
    },
    internal: !external,
    access: external && config.readAccess,
    accessControl: external && entityAccessControl(context, config.readAccessControl || config.writeAccessControl),
    daoPath(properties, { client, context }) {
      const id = properties[modelPropertyName]
      const path = config.fields ? modelRuntime().limitedPath(id, config.fields) : modelRuntime().path(id)
      return path
    }
  })
}


export function defineCreatedEvent(config, context) {
  const {
    service, modelRuntime, modelName, modelPropertyName
  } = context
  const eventName = modelName + 'Created'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    properties: {
      [modelPropertyName]: {
        type: String,
      },
      data: {
        type: Object
      }
    },
    execute(properties) {
      const id = properties[modelPropertyName]
      return modelRuntime().create({ ...properties.data, id })
    }
  })
}

export function defineUpdatedEvent(config, context) {
  const {
    service, modelRuntime, modelName, modelPropertyName
  } = context
  const eventName = modelName + 'Updated'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    properties: {
      [modelPropertyName]: {
        type: String,
      },
      data: {
        type: Object
      }
    },
    execute(properties) {
      const id = properties[modelPropertyName]
      return modelRuntime().update(id, { ...properties.data, id })
    }
  })
}

export function defineDeletedEvent(config, context) {
  const {
    service, modelRuntime, modelName, modelPropertyName,
  } = context
  const eventName = modelName + 'Deleted';
  (service as ServiceDefinition<ServiceDefinitionSpecification>).event({
    name: eventName,
    properties: {
      [modelPropertyName]: {
        type: String,
      }
    },
    execute(properties) {
      const id = properties[modelPropertyName]
      return modelRuntime().delete(id)
    }
  })
}

export function getCreateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    modelName, writeableProperties
  } = context
  const eventName = modelName + 'Created'
  async function execute(properties, { client, service, trigger }, emit) {
    const id = properties[modelPropertyName] || app.generateUid()
    const entity = await modelRuntime().get(id)
    if(entity) throw 'exists'
    const data = extractObjectData(writeableProperties, properties,
      App.computeDefaults(model, properties, { client, service } ))

    await App.validation.validate({ ...data }, validators,
      validationContext)

    await fireChangeTriggers(context, objectType, null, id,
      entity ? extractObjectData(writeableProperties, entity, {}) : null, data, trigger)
    emit({
      type: eventName,
      [modelPropertyName]: id,
      data
    })
    return id
  }
  return execute
}

export function defineCreateAction(config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    modelName, writeableProperties
  } = context
  const actionName = 'create' + modelName
  model.crud.create = actionName
  const action = (service as ServiceDefinition<ServiceDefinitionSpecification>).action<ActionDefinitionSpecificationAC>({
    name: actionName,
    properties: { ...model.properties },
    access: config.createAccess || config.writeAccess,
    accessControl: entityAccessControl(context, config.createAccessControl || config.writeAccessControl),
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error("not generated yet") }
  })
  const validators = App.validation.getValidators(action, service)
  const validationContext = { source: action, action }
  action.execute = getCreateFunction( validators, validationContext, config, context)
  service.actions[actionName] = action
}

export function defineCreateTrigger(config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    modelName, writeableProperties
  } = context
  const actionName = 'create' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = (service as ServiceDefinition<ServiceDefinitionSpecification>).trigger<TriggerDefinitionSpecificationAC>({
    name: triggerName,
    properties: { ...model.properties },
    skipValidation: true,
    waitForEvents: true,
    execute:  () => { throw new Error("not generated yet") }
  })
  const validators = App.validation.getValidators(trigger, service)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getCreateFunction( validators, validationContext, config, context)
}

export function getUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    modelName, writeableProperties
  } = context
  const eventName = modelName + 'Updated'
  async function execute(properties, { client, service, trigger }, emit) {
    const id = properties[modelPropertyName]
    const entity = await modelRuntime().get(id)
    if(!entity) throw 'not_found'
    const data = App.utils.mergeDeep({},
      extractObjectData(writeableProperties, properties, entity),
      App.computeUpdates(model, { ...entity, ...properties }, { client, service })
    )
    await App.validation.validate({ ...data }, validators,
      validationContext)
    await fireChangeTriggers(context, objectType, null, id,
      entity ? extractObjectData(writeableProperties, entity, {}) : null, data, trigger)
    emit({
      type: eventName,
      [modelPropertyName]: id,
      data
    })
  }
  return execute
}

export function defineUpdateAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    modelName, writeableProperties
  } = context
  const actionName = 'update' + modelName
  model.crud.update = actionName
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties),
      [modelPropertyName]: {
        type: modelPropertyName
      }
    },
    access: config.updateAccess || config.writeAccess,
    accessControl: entityAccessControl(context, config.updateAccessControl || config.writeAccessControl),
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error("not generated yet") }
  })
  const validators = App.validation.getValidators(action, service)
  const validationContext = { source: action, action }
  action.execute = getUpdateFunction( validators, validationContext, config, context)
  service.actions[actionName] = action
}

export function defineUpdateTrigger(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    modelName, writeableProperties
  } = context
  const actionName = 'update' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      ...(model.properties),
      [modelPropertyName]: {
        type: modelPropertyName
      }
    },
    skipValidation: true,
    waitForEvents: true,
    execute: () => { throw new Error("not generated yet") }
  })
  const validators = App.validation.getValidators(trigger, service)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getUpdateFunction( validators, validationContext, config, context)
  service.triggers[triggerName] = [trigger]
}

export function getDeleteFunction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, modelName, writeableProperties,
  } = context
  const eventName = modelName + 'Deleted'
  async function execute(properties, { client, service, trigger }, emit) {
    const id = properties[modelPropertyName]
    const entity = await modelRuntime().get(id)
    if(!entity) throw new Error('not_found')
    await fireChangeTriggers(context, objectType, null, id,
      entity ? extractObjectData(writeableProperties, entity, {}) : null, null, trigger)
    emit({
      type: eventName,
      [modelPropertyName]: id
    })
  }
  return execute
}

export function defineDeleteAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    modelName, writeableProperties
  } = context
  const actionName = 'delete' + modelName
  model.crud.delete = actionName
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties),
      [modelPropertyName]: {
        type: modelPropertyName
      }
    },
    access: config.deleteAccess || config.writeAccess,
    accessControl: entityAccessControl(context, config.deleteAccessControl || config.writeAccessControl),
    skipValidation: true,
    waitForEvents: true,
    execute: getDeleteFunction(config, context)
  })
}

export function defineDeleteTrigger(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    modelName, writeableProperties
  } = context
  const actionName = 'delete' + modelName
  const triggerName = `${service.name}_${actionName}`
  service.triggers[triggerName] = [new TriggerDefinition({
    name: actionName,
    properties: {
      ...(model.properties),
      [modelPropertyName]: {
        type: modelPropertyName
      }
    },
    skipValidation: true,
    waitForEvents: true,
    execute: getDeleteFunction(config, context)
  })]
}