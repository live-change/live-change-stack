import definition from './definition.js'
import App from "@live-change/framework"
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
}  from '@live-change/framework'
import { User } from "./model.js"

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]

    if(model.userProperty) {
      console.log("MODEL " + modelName + " IS USER PROPERTY, CONFIG:", model.userProperty)
      if (model.properties.user) throw new Error('user property already exists!!!')

      const originalModelProperties = { ...model.properties }
      const modelProperties = Object.keys(model.properties)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.userProperty
      const writeableProperties = modelProperties || config.writableProperties

      if(model.propertyOf) throw new Error("model " + modelName + " already have owner")
      model.propertyOf = {
        what: User,
        ...config
      }

      /// TODO: delete on userDeleted trigger

      if(config.userReadAccess) {
        const viewName = 'myUser' + modelName
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          access(params, context) {
            if(!context.client.user) return false
            return config.userReadAccess ? config.userReadAccess(params, context) : true
          },
          daoPath(params, { client, context }) {
            return modelRuntime().path(client.user)
          }
        })
      }

      if(config.userViews) {
        for(const view of config.userViews) {
          const viewName = view.name || ('myUser' + (view.prefix || '') + modelName + (view.suffix || ''))
          service.views[viewName] = new ViewDefinition({
            name: viewName,
            access(params, context) {
              if(!context.client.user) return false
              return view.access ? view.access(params, context) : true
            },
            daoPath(params, { client, context }) {
              return view.fields
              ? modelRuntime().limitedPath(client.user, view.fields)
              : modelRuntime().path(client.user)
            }
          })
        }
      }

      if(config.userSetAccess || config.userWriteAccess) {
        const eventName = modelName + 'Set'
        const actionName = 'setMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties
          },
          access: config.userSetAccess || config.userWriteAccess,
          skipValidation: true,
          queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, {client, service}, emit) {
            let newObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                newObject[propertyName] = properties[propertyName]
              }
            }
            const data = App.utils.mergeDeep({},
              App.computeDefaults(model, properties, { client, service }), newObject)
            await App.validation.validate(data, validators, { source: action, action, service, app, client })
            emit({
              type: eventName,
              identifiers: {
                user: client.user
              },
              data
            })
          }
        })
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }

      if(config.userUpdateAccess || config.userWriteAccess) {
        const eventName = modelName + 'Updated'
        const actionName = 'updateMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties
          },
          access: config.userUpdateAccess || config.userWriteAccess,
          skipValidation: true,
          queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const entity = await modelRuntime().get(client.user)
            if(!entity) throw app.logicError("not_found")
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
              identifiers: {
                user: client.user
              },
              data: properties || {}
            })
          }
        })
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }

      if(config.userResetAccess || config.userWriteAccess) {
        const eventName = modelName + 'Reset'
        const actionName = 'resetMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.userResetAccess || config.userWriteAccess,
          queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, {client, service}, emit) {
            const entity = await modelRuntime().indexObjectGet('byUser', client.user)
            if (!entity) throw app.logicError("not_found")
            emit({
              type: eventName,
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