import definition from './definition.js'
import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
} from '@live-change/framework'
import { User } from "./model.js"
import  pluralize from 'pluralize'

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]
    if(model.userItem) {
      if (model.properties.user) throw new Error('user property already exists!!!')
      const originalModelProperties = { ...model.properties }
      const modelProperties = Object.keys(model.properties)
      const modelPropertyName = modelName.slice(0, 1).toLowerCase() + modelName.slice(1)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.userItem
      const writeableProperties = modelProperties || config.writableProperties

      //console.log("USER ITEM", model)
      if(model.itemOf) throw new Error("model " + modelName + " already have owner")
      model.itemOf = {
        what: User,
        ...config
      }

      /// TODO: delete on userDeleted trigger

      if(config.userReadAccess) {
        const viewName = 'myUser' + pluralize(modelName)
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          access(params, context) {
            if(!context.client.user) return false
            return config.userReadAccess ? config.userReadAccess(params, context) : true
          },
          properties: App.rangeProperties,
          daoPath(range, { client, context }) {
            const path = modelRuntime().indexRangePath('byUser', [client.user], range )
            return path
          }
        })
        for(const sortField of config.sortBy || []) {
          const sortFieldUc = sortField.slice(0, 1).toUpperCase() + sortField.slice(1)
          const viewName = 'myUser' + pluralize(modelName) + 'By' + sortFieldUc
          service.views[viewName] = new ViewDefinition({
            name: viewName,
            access(params, context) {
              if(!context.client.user) return false
              if(context.visibilityTest) return true
              return config.userReadAccess ? config.userReadAccess(params, context) : true
            },
            properties: App.rangeProperties,
            daoPath(range, { client, context }) {
              return modelRuntime().sortedIndexRangePath('byUser' + sortFieldUc, [client.user], range )
            }
          })
        }        
      }

      if(config.userReadAccess) {
        const viewName = 'myUser' + modelName
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          async access(params, context) {          
            if(!context.client.user) return false
            if(context.visibilityTest) return true
            const data = await modelRuntime().get(params[modelPropertyName])
            if(data.user !== context.client.user) return false
            return config.userReadAccess ? config.userReadAccess(params, context) : true
          },
          properties: App.rangeProperties,
          daoPath(params, { client, context }) {
            const path = modelRuntime().path(params[modelPropertyName])
            return path
          }
        }) 
      }

      if(config.userCreateAccess || config.userWriteAccess) {
        const eventName = modelName + 'Created'
        const actionName = 'createMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.userCreateAccess || config.userWriteAccess,
          properties: {
            ...originalModelProperties,
            [modelPropertyName]: {
              type: model,
              validation: ['localId']
            }
          },
          queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const id = properties[modelPropertyName] || app.generateUid()
            const entity = await modelRuntime().get(id)
            if(entity) throw 'exists'
            emit({
              type: eventName,
              [modelPropertyName]: id,
              identifiers: {
                user: client.user,
              },
              data: properties
            })
            return id
          }
        })
      }
      if(config.userUpdateAccess || config.userWriteAccess) {
        const eventName = modelName + 'Updated'
        const actionName = 'updateMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.userUpdateAccess || config.userWriteAccess,
          properties: {
            ...originalModelProperties,
            [modelPropertyName]: {
              type: model,
              validation: ['nonEmpty']
            }
          },
          skipValidation: true,
          queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const entity = await modelRuntime().get(properties[modelPropertyName])
            if(!entity) throw 'not_found'
            if(entity.user !== client.user) throw 'not_authorized'
            let updateObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                updateObject[propertyName] = properties[propertyName]
              }
            }
            const merged = App.utils.mergeDeep({}, entity, updateObject)
            await App.validation.validate(merged, validators, { source: action, action, service, app, client })
            emit({
              type: eventName,
              [modelPropertyName]: entity.id,
              identifiers: {
                user: client.user,
              },
              data: properties
            })
          }
        })
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }
      if(config.userDeleteAccess || config.userWriteAccess) {
        const eventName = modelName + 'Deleted'
        const actionName = 'deleteMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.userDeleteAccess || config.userWriteAccess,
          properties: {
            [modelPropertyName]: {
              type: model,
              validation: ['nonEmpty']
            }
          },
          queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const entity = await modelRuntime().get(properties[modelPropertyName])
            if(!entity) throw 'not_found'
            if(entity.user !== client.user) throw 'not_authorized'
            emit({
              type: eventName,
              [modelPropertyName]: entity.id,
              identifiers: {
                user: client.user
              }
            })
          }
        })
      }
    }
  }

})