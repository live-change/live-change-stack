import {
  defineProperties, defineIndex,
  processModelsAnnotation, extractIdParts, extractIdentifiers, extractObjectData, prepareAccessControl
} from './utils.js'
import { fireChangeTriggers } from "./changeTriggers.js"
import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition, TriggerDefinition
} from "@live-change/framework"
import pluralize from 'pluralize'

const annotation = 'entity'

function entityAccessControl({service, modelName, modelPropertyName}, accessControl) {
  if(!accessControl) return undefined
  return {
    objects: p => [{ objectType: service.name + '_' + modelName, object: p[modelPropertyName]}],
    ...accessControl
  }
}

function defineView(config, context, external) {
  const { service, modelRuntime, modelPropertyName, modelName, model } = context
  const viewName = (config.prefix || '' ) + (config.prefix ? modelName : modelPropertyName) + (config.suffix || '')
  if(external) model.crud.read = viewName
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

function defineRangeView(config, context, external = true) {
  const { service, modelRuntime, modelPropertyName, modelName, model } = context
  const viewName = (config.prefix || '' ) + pluralize(config.prefix ? modelName : modelPropertyName) + (config.suffix || '')
  if(external) model.crud.range = viewName
  service.views[viewName] = new ViewDefinition({
    name: viewName,
    properties: {
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
    access: external && config.readAllAccess,
    daoPath(properties, { client, context }) {
      const range = App.extractRange(properties)
      const path = modelRuntime().rangePath(range)
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

function defineUpdatedEvent(config, context) {
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

function defineDeletedEvent(config, context) {
  const {
    service, modelRuntime, modelName, modelPropertyName,
  } = context
  const eventName = modelName + 'Deleted'
  service.events[eventName] = new EventDefinition({
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

function getCreateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    modelName, writeableProperties
  } = context
  const eventName = modelName + 'Created'
  async function execute(properties, { client, service }, emit) {
    const id = properties[modelPropertyName] || app.generateUid()
    const entity = await modelRuntime().get(id)
    if(entity) throw 'exists'
    const data = extractObjectData(writeableProperties, properties,
      App.computeDefaults(model, properties, { client, service } ))

    await App.validation.validate({ ...data }, validators,
      validationContext)

    await fireChangeTriggers(context, objectType, null, id,
      entity ? extractObjectData(writeableProperties, entity, {}) : null, data)
    emit({
      type: eventName,
      [modelPropertyName]: id,
      data
    })
    return id
  }
  return execute
}

function defineCreateAction(config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    modelName, writeableProperties
  } = context
  const actionName = 'create' + modelName
  model.crud.create = actionName
  const action = new ActionDefinition({
    name: actionName,
    properties: { ...model.properties },
    access: config.createAccess || config.writeAccess,
    accessControl: entityAccessControl(context, config.createAccessControl || config.writeAccessControl),
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error("not generated yet") }
  })
  const validators = App.validation.getValidators(action, service, action)
  const validationContext = { source: action, action }
  action.execute = getCreateFunction( validators, validationContext, config, context)
  service.actions[actionName] = action
}

function defineCreateTrigger(config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    modelName, writeableProperties
  } = context
  const actionName = 'create' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: { ...model.properties },
    skipValidation: true,
    waitForEvents: true,
    execute:  () => { throw new Error("not generated yet") }
  })
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getCreateFunction( validators, validationContext, config, context)
  service.triggers[triggerName] = [trigger]
}

function getUpdateFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    modelName, writeableProperties
  } = context
  const eventName = modelName + 'Updated'
  async function execute(properties, { client, service }, emit) {
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
      entity ? extractObjectData(writeableProperties, entity, {}) : null, data)
    emit({
      type: eventName,
      [modelPropertyName]: id,
      data
    })
  }
  return execute
}

function defineUpdateAction(config, context) {
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
  const validators = App.validation.getValidators(action, service, action)
  const validationContext = { source: action, action }
  action.execute = getUpdateFunction( validators, validationContext, config, context)
  service.actions[actionName] = action
}

function defineUpdateTrigger(config, context) {
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
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getUpdateFunction( validators, validationContext, config, context)
  service.triggers[triggerName] = [trigger]
}

function getDeleteFunction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, modelName, writeableProperties,
  } = context
  const eventName = modelName + 'Deleted'
  async function execute(properties, { client, service }, emit) {
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
  return execute
}

function defineDeleteAction(config, context) {
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

function defineDeleteTrigger(config, context) {
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

    model.identifiers = [{ name: modelPropertyName, field: 'id' }]
    model.crud = {}

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
      service, app, model, originalModelProperties, modelProperties, modelPropertyName, modelRuntime,
      modelName, writeableProperties, annotation, objectType
    }

    defineView(config, context, config.readAccess || config.readAccessControl || config.writeAccessControl)
    defineRangeView(config, context, config.readAllAccess)
    /// TODO: multiple views with limited fields

    defineCreatedEvent(config, context)
    defineUpdatedEvent(config, context)
    defineDeletedEvent(config, context)

    defineCreateTrigger(config, context)
    defineUpdateTrigger(config, context)
    defineDeleteTrigger(config, context)

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
