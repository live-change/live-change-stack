import definition from './definition.js'
import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
} from '@live-change/framework'
import { Session } from "./model.js"

import pluralize from 'pluralize'

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]
    if(model.sessionItem) {
      console.trace("PROCESS MODEL " + modelName)
      if (model.properties.session) throw new Error('session property already exists!!!')
      const originalModelProperties = {...model.properties}
      const modelProperties = Object.keys(model.properties)
      const modelPropertyName = modelName.slice(0, 1).toLowerCase() + modelName.slice(1)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.sessionItem
      const writeableProperties = modelProperties || config.writableProperties

      console.log("SESSION ITEM", model)

      if(model.itemOf) throw new Error("model " + modelName + " already have owner")
      model.itemOf = {
        what: Session,
        ...config
      }

      if (!model.ownerCrud) model.ownerCrud = {}

      if(config.sessionReadAccess) {
        const viewName = 'mySession' + pluralize(modelName)
        model.ownerCrud.range ??= viewName
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          access: config.sessionReadAccess,
          properties: App.rangeProperties,
          daoPath(range, { client, context }) {
            const path = modelRuntime().indexRangePath('bySession', [client.session], range )
            return path
          }
        })
        for(const sortField of config.sortBy) {
          const sortFieldUc = sortField.slice(0, 1).toUpperCase() + sortField.slice(1)
          const viewName = 'mySession' + pluralize(modelName) + 'By' + sortFieldUc
          service.views[viewName] = new ViewDefinition({
            name: viewName,
            access: config.sessionReadAccess,
            properties: App.rangeProperties,
            daoPath(range, { client, context }) {
              return modelRuntime().sortedIndexRangePath('bySession' + sortFieldUc, [client.session], range )
            }
          })
        }
      }

      if(config.sessionReadAccess) {
        const viewName = 'mySession' + modelName
        model.ownerCrud.read ??= viewName
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          async access(params, context) {
            if(!context.client.session) return false
            if(context.visibilityTest) return true
            const data = await modelRuntime().get(params[modelPropertyName])
            if(data.session !== context.client.session) return false
            return config.sessionReadAccess ? config.sessionReadAccess(params, context) : true
          },
          properties: App.rangeProperties,
          daoPath(params, { client, context }) {
            const path = modelRuntime().path(params[modelPropertyName])
            return path
          }
        })
      }

      if(config.sessionCreateAccess || config.sessionWriteAccess) {
        const eventName = modelName + 'Created'
        const actionName = 'createMySession' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          skipValidation: true,
          access: config.sessionCreateAccess || config.sessionWriteAccess,
          properties: {
            ...originalModelProperties,
            [modelPropertyName]: {
              type: model,
              validation: ['localId']
            }
          },
          //queuedBy: (command) => command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const id = properties[modelPropertyName] || app.generateUid()
            const entity = await modelRuntime().get(id)
            if(entity) throw app.logicError("exists")
            let newObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                newObject[propertyName] = properties[propertyName]
              }
            }
            const data = App.utils.mergeDeep({},
              App.computeDefaults(model, properties, { client, service }), newObject)
            await App.validation.validate(data, validators, validationContext)
            emit({
              type: eventName,
              [modelPropertyName]: id,
              identifiers: {
                session: client.session,
              },
              data
            })
            return id
          }
        })
        model.ownerCrud.create ??= actionName
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }
      if(config.sessionUpdateAccess || config.sessionWriteAccess) {
        const eventName =  modelName + 'Updated'
        const actionName = 'updateMySession' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.sessionUpdateAccess || config.sessionWriteAccess,
          properties: {
            ...originalModelProperties,
            [modelPropertyName]: {
              type: model,
              validation: ['nonEmpty']
            }
          },
          skipValidation: true,
          queuedBy: (command) => command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const entity = await modelRuntime().get(properties[modelPropertyName])
            if(!entity) throw app.logicError("not_found")
            if(entity.session != client.session) throw app.logicError("not_authorized")
            let updateObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                updateObject[propertyName] = properties[propertyName]
              }
            }
            const computedUpdates = App.computeUpdates(model, { ...entity, ...properties }, { client, service })
            const data = App.utils.mergeDeep({}, updateObject, computedUpdates)
            const merged = App.utils.mergeDeep({}, entity, data)
            await App.validation.validate({ ...merged, [modelPropertyName]: entity.id }, validators, validationContext)
            emit({
              type: eventName,
              [modelPropertyName]: entity.id,
              identifiers: {
                session: client.session,
              },
              data
            })
          }
        })
        model.ownerCrud.update ??= actionName
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }
      if(config.sessionDeleteAccess || config.sessionWriteAccess) {
        const eventName = modelName + 'Deleted'
        const actionName = 'deleteMySession' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.sessionDeleteAccess || config.sessionWriteAccess,
          properties: {
            [modelPropertyName]: {
              type: model,
              validation: ['nonEmpty']
            }
          },
          queuedBy: (command) => command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const entity = await modelRuntime().get(properties[modelPropertyName])
            if(!entity) throw app.logicError("not_found")
            if(entity.session != client.session) throw app.logicError("not_authorized")
            emit({
              type: eventName,
              [modelPropertyName]: entity.id,
              identifiers: {
                session: client.session
              }
            })
          }
        })
        model.ownerCrud.delete ??= actionName
      }
    }
  }

})