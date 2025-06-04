import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, TriggerDefinition
} from "@live-change/framework"
import {
  extractIdParts,
  extractIdentifiers,
  extractObjectData,
  prepareAccessControl,
  cloneAndPrepareAccessControl
} from './utils.js'
import { fireChangeTriggers } from "./changeTriggers.js"
import pluralize from 'pluralize'

function defineRangeView(config, context, external = true) {
  const { service, modelRuntime, otherPropertyNames, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model } = context
  const indexName = 'by'+context.joinedOthersClassName
  const viewProperties = {}
  for (let i = 0; i < others.length; i++) {
    viewProperties[otherPropertyNames[i][0].toLowerCase() + otherPropertyNames[i].slice(1) ] = new PropertyDefinition({
      type: others[i],
      validation: ['nonEmpty']
    })
  }
  const viewName = joinedOthersPropertyName + context.reverseRelationWord + pluralize(modelName)
  model.crud['rangeBy' + joinedOthersPropertyName[0].toUpperCase() + joinedOthersPropertyName.slice(1)] = viewName
  const sourceAccessControl = external && (config.readAccessControl || config.writeAccessControl)
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames, others)
  if(viewName === 'companyOwnedProducts') {
    console.error("ACCESS CONTROL", viewName, accessControl, otherPropertyNames, others)
    if(accessControl) accessControl.kutas = 1
  }
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
    global: config.globalView,
    access: external && (config.readAccess || config.writeAccess),
    accessControl,
    daoPath(properties, { client, context }) {
      const idParts = extractIdParts(otherPropertyNames, properties)
      const range = App.extractRange(properties)
      const path = modelRuntime().sortedIndexRangePath(indexName, idParts, range)
      return path
    }
  })
}

function defineSingleView(config, context, external = true) {
  const { service, modelRuntime, objectType, joinedOthersPropertyName, joinedOthersClassName,
    modelName, others, model, modelPropertyName } = context
  const viewProperties = {}
  viewProperties[modelPropertyName] = new PropertyDefinition({
    type: model,
    validation: ['nonEmpty']
  })
  const viewName = modelName[0].toLowerCase() + modelName.slice(1)
  model.crud.read = viewName
  const sourceAccessControl = external && (config.readAccessControl || config.writeAccessControl)
  const accessControl = cloneAndPrepareAccessControl(
    sourceAccessControl, [modelPropertyName], [objectType]
  )
  service.views[viewName] = new ViewDefinition({
    name: viewName,
    properties: {
      ...viewProperties,
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
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = modelName + 'Created'
  return async function execute(properties, { client, service, trigger }, emit) {
    const id = properties[modelPropertyName] || app.generateUid()
    const entity = await modelRuntime().get(id)
    if(entity) throw 'exists'
    const identifiers = extractIdentifiers(otherPropertyNames, properties)
    const data = extractObjectData(writeableProperties, properties,
      App.computeDefaults(model, properties, { client, service } ))
    await App.validation.validate({ ...identifiers, ...data }, validators,
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
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const actionName = 'create' + modelName
  model.crud.create = actionName
  const sourceAccessControl = config.createAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(sourceAccessControl, otherPropertyNames, others)
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
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const actionName = 'create' + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      ...(model.properties)
    },
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
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = modelName + 'Updated'
  return async function execute(properties, { client, service, trigger }, emit) {
    const id = properties[modelPropertyName]
    const entity = await modelRuntime().get(id)
    if(!entity) throw 'not_found'
    const entityIdParts = extractIdParts(otherPropertyNames, entity)
    const idParts = extractIdParts(otherPropertyNames, properties)
    if(JSON.stringify(entityIdParts) !== JSON.stringify(idParts)) {
      throw 'not_authorized'
    }
    const identifiers = extractIdentifiers(otherPropertyNames, properties)
    const data = App.utils.mergeDeep({},
      extractObjectData(writeableProperties, properties, entity),
      App.computeUpdates(model, { ...entity, ...properties }, { client, service })
    )
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
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const actionName = 'update' + modelName
  model.crud.update = actionName
  const sourceAccessControl = config.updateAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(
    sourceAccessControl, [modelPropertyName], [objectType]
  )
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
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
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
      ...(model.properties)
    },
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

function getDeleteFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = modelName + 'Deleted'
  return async function execute(properties, { client, service, trigger }, emit) {
    const id = properties[modelPropertyName]
    const entity = await modelRuntime().get(id)
    if(!entity) throw 'not_found'
    const entityIdParts = extractIdParts(otherPropertyNames, entity)
    const idParts = extractIdParts(otherPropertyNames, properties)
    if(JSON.stringify(entityIdParts) !== JSON.stringify(idParts)) {
      throw 'not_authorized'
    }
    const identifiers = extractIdentifiers(otherPropertyNames, entity)
    await fireChangeTriggers(context, objectType, identifiers, id,
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
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const actionName = 'delete' + modelName
  model.crud.delete = actionName
  const sourceAccessControl = config.deleteAccessControl || config.writeAccessControl
  const accessControl = cloneAndPrepareAccessControl(
    sourceAccessControl, [modelPropertyName], [objectType]
  )
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      },
      ...(model.properties)
    },
    access: config.deleteAccess || config.writeAccess,
    accessControl,
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    timeout: config.deleteTimeout,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(action, service, action)
  const validationContext = { source: action, action }
  action.execute = getDeleteFunction( validators, validationContext, config, context)
  service.actions[actionName] = action
}

function defineDeleteTrigger(config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
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
      ...(model.properties)
    },
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getDeleteFunction( validators, validationContext, config, context)
  service.triggers[triggerName] = [trigger]
}

function getCopyFunction( validators, validationContext, config, context) {
  const {
    service, app, model, modelPropertyName, modelRuntime, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others
  } = context
  const eventName = modelName + 'Copied'
  return async function execute(properties, { client, service, trigger }, emit) {
    const id = properties[modelPropertyName]
    const entity = await modelRuntime().get(id)
    if(!entity) throw new Error('not_found')
    const entityIdParts = extractIdParts(otherPropertyNames, entity)
    const idParts = extractIdParts(otherPropertyNames, properties)
    const identifiers = extractIdentifiers(otherPropertyNames, entity)
    if(JSON.stringify(entityIdParts) !== JSON.stringify(idParts)) {
      throw new Error('not_authorized')
    }
    const srcData = extractObjectData(writeableProperties, properties, entity)
    const updatedData = App.utils.mergeDeep(srcData, properties.updates)
    const newId = app.generateUid()
    const dataWithIdentifiers = { [modelPropertyName]: newId, ...identifiers, ...updatedData }
    await App.validation.validate(dataWithIdentifiers, validators,
      validationContext)
    app.trigger({
      type: 'copy'+service.name[0].toUpperCase()+service.name.slice(1)+'_'+modelName,
    }, {
      objectType,
      object: newId,
      from: id,
      identifiers,
      data: updatedData
    }),
      app.trigger({
        type: 'copyObject',
      }, {
        objectType,
        object: newId,
        from: id,
        identifiers,
        data: updatedData
      })
    await fireChangeTriggers(context, objectType, identifiers, newId, null, updatedData, trigger)
    emit({
      type: eventName,
      [modelPropertyName]: newId,
      ['from'+modelPropertyName[0].toUpperCase() + modelPropertyName.slice(1)]: id,
      identifiers,
      data: updatedData
    })
    return {
      newId,
    }
  }

}

function defineCopyAction(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others,
    identifiers
  } = context
  const actionName = 'copy' + modelName
  const sourceAccessControl = config.copyAccessControl
  const accessControl = cloneAndPrepareAccessControl(
    sourceAccessControl, [modelPropertyName], [objectType]
  )
  const action = new ActionDefinition({
    name: actionName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      },
      ...(identifiers),
      updates: {
        type: 'object',
        properties: {
          ...(model.properties)
        }
      }
    },
    access: config.copyAccess,
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(action, service, action)
  const validationContext = { source: action, action }
  action.execute = getCopyFunction( validators, validationContext, config, context)
  service.actions[actionName] = action
}

function defineCopyTrigger(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName, others,
    identifiers
  } = context
  const actionName = 'copy' + joinedOthersClassName + context.reverseRelationWord + modelName
  const triggerName = `${service.name}_${actionName}`
  const trigger = new TriggerDefinition({
    name: triggerName,
    properties: {
      [modelPropertyName]: {
        type: model,
        validation: ['nonEmpty']
      },
      ...(identifiers),
      updates: {
        type: 'object',
        properties: {
          ...(model.properties)
        }
      }
    },
    skipValidation: true,
    //queuedBy: otherPropertyNames,
    waitForEvents: true,
    execute: () => { throw new Error('not generated yet') }
  })
  const validators = App.validation.getValidators(trigger, service, trigger)
  const validationContext = { source: trigger, trigger }
  trigger.execute = getCopyFunction( validators, validationContext, config, context)
  service.triggers[triggerName] = [trigger]
}

function defineCopyOnParentCopyTrigger(config, context) {
  const {
    service, app, model, modelRuntime, modelPropertyName, objectType,
    otherPropertyNames, others, joinedOthersPropertyName, modelName, writeableProperties, joinedOthersClassName,
  } = context
  const eventName = modelName + 'Copied'
  const triggerName = 'copyOnParentCopy_' + service.name + '_' + modelName
  if(!service.triggers[triggerName]) service.triggers[triggerName] = []
  service.triggers[triggerName].push(new TriggerDefinition({
    name: triggerName,
    properties: {
      objectType: {
        type: String,
      },
      object: {
        type: String,
      },
      parentType: {
        type: String,
      },
      parent: {
        type: String,
      },
      fromParent: {
        type: String,
      },
      identifiers: {
        type: Object,
      },
      data: {
        type: Object,
      }
    },
    async execute({ objectType, object, parentType, parent, fromParent, identifiers, data },
       { client, service, trigger }, emit) {
      const newIdentifiers = {
        ...identifiers
      }
      for(let i = 0; i < others.length; i++) {
        const other = others[i]
        if(other === parentType) {
          newIdentifiers[otherPropertyNames[i]] = parent
        }
      }
      const newId = app.generateUid()
      app.trigger({
        type: 'copy'+service.name[0].toUpperCase()+service.name.slice(1)+'_'+modelName,
      }, {
        objectType,
        object: newId,
        from: object,
        identifiers: newIdentifiers,
        data
      })
      app.trigger({
        type: 'copyObject',
      }, {
        objectType,
        object: newId,
        from: object,
        identifiers: newIdentifiers,
        data
      })
      await fireChangeTriggers(context, objectType, newIdentifiers, newId, null, data, trigger)
      emit({
        type: eventName,
        [modelPropertyName]: newId,
        ['from'+modelPropertyName[0].toUpperCase() + modelPropertyName.slice(1)]: object,
        identifiers,
        data
      })
    }
  }))
}

function defineSortIndex(context, sortFields) {
  if(!Array.isArray(sortFields)) sortFields = [sortFields]
  console.log("DEFINE SORT INDEX", sortFields)
  const sortFieldsUc = sortFields.map(fd=>fd.slice(0, 1).toUpperCase() + fd.slice(1))
  const indexName = 'by' + context.joinedOthersClassName + sortFieldsUc.join('')
  context.model.indexes[indexName] = new IndexDefinition({
    property: [...context.otherPropertyNames, ...sortFields]
  })
}

export {
  defineRangeView, defineSingleView,
  defineCreateAction, defineUpdateAction, defineDeleteAction, defineCopyAction,
  defineCreateTrigger, defineUpdateTrigger, defineDeleteTrigger, defineCopyTrigger,
  defineCopyOnParentCopyTrigger,
  defineSortIndex,
}
