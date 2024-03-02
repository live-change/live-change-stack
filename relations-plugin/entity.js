import {
  defineProperties, defineIndex,
  processModelsAnnotation, extractIdParts, extractIdentifiers, extractObjectData
} from './utils.js'
import { fireChangeTriggers } from "./changeTriggers.js"
import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
} from "@live-change/framework"

const annotation = 'entity'

function entityAccessControl({service, modelName, modelPropertyName}, accessControl) {
  if(!accessControl) return undefined
  return {
    objects: p => [{ objectType: service.name + '_' + modelName, object: p[modelPropertyName]}],
    ...accessControl
  }
}

function defineView(config, context) {
  const { service, modelRuntime, modelPropertyName, modelName, model } = context
  const viewName = (config.prefix || '' ) + (config.prefix ? modelName : modelPropertyName) + (config.suffix || '')
  service.views[viewName] = new ViewDefinition({
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
    access: config.access,
    accessControl: entityAccessControl(context, config.readAccessControl || config.writeAccessControl),
    daoPath(properties, { client, context }) {
      const id = properties[modelPropertyName]
      const path = config.fields ? modelRuntime().limitedPath(id, config.fields) : modelRuntime().path(id)
      return path
    }
  })
}

function defineCreatedEvent(config, context) {
  const {
    service, modelRuntime, modelName, modelPropertyName
  } = context
  const eventName = modelName + 'Created'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute(properties) {
      const id = properties[modelPropertyName]
      return modelRuntime().create({ ...properties.data, id })
    }
  })
}

function defineUpdatedEvent(config, context) {
  const {
    service, modelRuntime, modelName, modelPropertyName
  } = context
  const eventName = modelName + 'Updated'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute(properties) {
      const id = properties[modelPropertyName]
      return modelRuntime().update(id, { ...properties.data, id })
    }
  })
}

function defineDeletedEvent(config, context) {
  const {
    service, modelRuntime, modelName, modelPropertyName,
  } = context
  const eventName = modelName + 'Deleted'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute(properties) {
      const id = properties[modelPropertyName]
      return modelRuntime().delete(id)
    }
  })
}


function defineCreateAction(config, context) {
  const {
    service, app, model,  defaults, modelPropertyName, modelRuntime, objectType,
    modelName, writeableProperties
  } = context
  const eventName = modelName + 'Created'
  const actionName = 'create' + modelName
  service.actions[actionName] = new ActionDefinition({
    name: actionName,
    properties: {
      ...(model.properties)
    },
    access: config.createAccess || config.writeAccess,
    accessControl: entityAccessControl(context, config.createAccessControl || config.writeAccessControl),
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    async execute(properties, { client, service }, emit) {
      const id = properties[modelPropertyName] || app.generateUid()
      const entity = await modelRuntime().get(id)
      if(entity) throw 'exists'
      const data = extractObjectData(writeableProperties, properties, defaults)
      await App.validation.validate({ ...data }, validators,
        { source: action, action, service, app, client })

      await fireChangeTriggers(context, objectType, null, id,
          entity ? extractObjectData(writeableProperties, entity, {}) : null, data)
      emit({
        type: eventName,
        [modelPropertyName]: id,
        data
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
    modelName, writeableProperties
  } = context
  const eventName = modelName + 'Updated'
  const actionName = 'update' + modelName
  service.actions[actionName] = new ActionDefinition({
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
    async execute(properties, { client, service }, emit) {
      const id = properties[modelPropertyName]
      const entity = await modelRuntime().get(id)
      if(!entity) throw 'not_found'
      const data = extractObjectData(writeableProperties, properties, entity)
      await App.validation.validate({ ...identifiers, ...data }, validators,
        { source: action, action, service, app, client })
      await fireChangeTriggers(context, null, id,
          entity ? extractObjectData(writeableProperties, entity, {}) : null, data)
      emit({
        type: eventName,
        [modelPropertyName]: id,
        data
      })
    }
  })
  const action = service.actions[actionName]
  const validators = App.validation.getValidators(action, service, action)
}

function defineDeleteAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, modelName, writeableProperties,
  } = context
  const eventName = modelName + 'Deleted'
  const actionName = 'delete' + modelName
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
    async execute(properties, { client, service }, emit) {
      const id = properties[modelPropertyName]
      const entity = await modelRuntime().get(id)
      if(!entity) throw new Error('not_found')
      await fireChangeTriggers(context, objectType, null, id,
          entity ? extractObjectData(writeableProperties, entity, {}) : null, null)
      emit({
        type: eventName,
        [modelPropertyName]: id
      })
    }
  })
}

export default function(service, app) {
  if (!service) throw new Error("no service")
  if (!app) throw new Error("no app")

  for(let modelName in service.models) {
    const model = service.models[modelName]
    const config = model[annotation]
    if(!config) continue

    if (model[annotation + 'Processed']) throw new Error("duplicated processing of " + annotation + " processor")
    model[annotation + 'Processed'] = true

    const originalModelProperties = { ...model.properties }
    const modelProperties = Object.keys(model.properties)
    const modelPropertyName = modelName.slice(0, 1).toLowerCase() + modelName.slice(1)
    const defaults = App.utils.generateDefault(originalModelProperties)

    function modelRuntime() {
      return service._runtime.models[modelName]
    }

    if (!model.indexes) {
      model.indexes = {}
    }

    const writeableProperties = modelProperties || config.writeableProperties
    //console.log("PPP", others)
    const objectType = service.name + '_' + modelName

    const context = {
      service, app, model, originalModelProperties, modelProperties, modelPropertyName, defaults, modelRuntime,
      modelName, writeableProperties, annotation, objectType
    }

    if (config.readAccess || config.readAccessControl || config.writeAccessControl) {
      defineView(config, context)
    }
    /// TODO: multiple views with limited fields

    defineCreatedEvent(config, context)
    defineUpdatedEvent(config, context)
    defineDeletedEvent(config, context)

    if (config.createAccess || config.writeAccess || config.createAccessControl || config.writeAccessControl) {
      defineCreateAction(config, context)
    }

    if (config.updateAccess || config.writeAccess || config.updateAccessControl || config.writeAccessControl) {
      defineUpdateAction(config, context)
    }

    if (config.deleteAccess || config.writeAccess || config.deleteAccessControl || config.writeAccessControl) {
      defineDeleteAction(config, context)
    }

  }
}
