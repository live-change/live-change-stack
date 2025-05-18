import {
  includeAccessRoles, defineGlobalRangeView
} from './utils.js'

import {
  defineView, defineCreatedEvent, defineUpdatedEvent, defineDeletedEvent, defineCreateAction,
  defineUpdateAction, defineDeleteAction, defineCreateTrigger, defineUpdateTrigger, defineDeleteTrigger,
  ModelDefinitionSpecificationWithEntity,
  EntityConfig,
  EntityContext
} from './entityUtils.js'

export type { EntityConfig, ModelDefinitionSpecificationWithEntity } from './entityUtils.js'

export default function(service, app) {
  if (!service) throw new Error("no service")
  if (!app) throw new Error("no app")

  for(let modelName in service.models) {
    const model: ModelDefinitionSpecificationWithEntity = 
      service.models[modelName] as ModelDefinitionSpecificationWithEntity
    const config:EntityConfig = model.entity
    if(!config) continue

    if (model.entityProcessed) throw new Error("duplicated processing of entity processor")
    model.entityProcessed = true

    const originalModelProperties = { ...model.properties }
    const modelProperties = Object.keys(model.properties)
    const modelPropertyName = modelName.slice(0, 1).toLowerCase() + modelName.slice(1)

    model.identifiers = [{ name: modelPropertyName, field: 'id' }]
    model.crud = {}
    includeAccessRoles(model, [
      config.readAccessControl, config.writeAccessControl,
      config.createAccessControl, config.updateAccessControl, config.deleteAccessControl
    ])

    function modelRuntime() {
      return service._runtime.models[modelName]
    }

    if (!model.indexes) {
      model.indexes = {}
    }

    const writeableProperties = modelProperties || config.writeableProperties
    //console.log("PPP", others)
    const objectType = service.name + '_' + modelName

    const context: EntityContext = {
      service, app, model, originalModelProperties, modelProperties, modelPropertyName, modelRuntime,
      modelName, writeableProperties, annotation: 'entity', objectType
    }

    defineView(config, context, config.readAccess || config.readAccessControl || config.writeAccessControl)
    defineGlobalRangeView(config, context, !!config.readAllAccess)
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
